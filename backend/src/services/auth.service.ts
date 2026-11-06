import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import type { AuthResponse, LoginDto, RegisterDto, TokenPair, UserDto } from '@cityfix/shared';
import type { User } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../lib/AppError';
import { prisma } from '../lib/prisma';
import { userRepo } from '../repositories/user.repo';
import { refreshTokenRepo } from '../repositories/refreshToken.repo';
import { generateRefreshToken, hashToken, signAccessToken } from './token.service';

const BCRYPT_ROUNDS = env.NODE_ENV === 'test' ? 4 : 12;
// Hash falso para igualar tiempos cuando el email no existe (evita enumeración por timing).
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

export const toUserDto = (u: User): UserDto => ({
  id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt.toISOString(),
});

async function issueTokens(user: User, familyId: string): Promise<TokenPair & { id: string }> {
  const refreshToken = generateRefreshToken();
  const row = await refreshTokenRepo.create({
    userId: user.id,
    familyId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + env.REFRESH_TTL_DAYS * 86_400_000),
  });
  return { id: row.id, accessToken: signAccessToken(user.id, user.role), refreshToken };
}

export const authService = {
  async register(dto: RegisterDto): Promise<AuthResponse> {
    if (await userRepo.findByEmail(dto.email)) throw AppError.conflict('El email ya está registrado');
    const user = await userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    });
    const { accessToken, refreshToken } = await issueTokens(user, crypto.randomUUID());
    return { user: toUserDto(user), accessToken, refreshToken };
  },

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await userRepo.findByEmail(dto.email);
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw AppError.unauthorized('Credenciales inválidas');
    const { accessToken, refreshToken } = await issueTokens(user, crypto.randomUUID());
    return { user: toUserDto(user), accessToken, refreshToken };
  },

  /** Rotación: cada refresh invalida el token usado y emite uno nuevo en la misma familia.
   *  Si se presenta un token ya rotado/revocado se asume robo y se revoca toda la familia. */
  async refresh(token: string): Promise<TokenPair> {
    const stored = await refreshTokenRepo.findByHash(hashToken(token));
    if (!stored) throw AppError.unauthorized('Refresh token inválido');
    if (stored.revokedAt) {
      await refreshTokenRepo.revokeFamily(stored.familyId);
      throw AppError.unauthorized('Refresh token reutilizado; sesión revocada');
    }
    if (stored.expiresAt < new Date()) throw AppError.unauthorized('Refresh token expirado');

    // Marcar el viejo como usado ANTES de emitir; si pierde la carrera es un reuso.
    const claimed = await refreshTokenRepo.revokeIfActive(stored.id);
    if (!claimed) {
      await refreshTokenRepo.revokeFamily(stored.familyId);
      throw AppError.unauthorized('Refresh token reutilizado; sesión revocada');
    }
    const next = await issueTokens(stored.user, stored.familyId);
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { replacedById: next.id } });
    return { accessToken: next.accessToken, refreshToken: next.refreshToken };
  },

  async logout(token: string): Promise<void> {
    const stored = await refreshTokenRepo.findByHash(hashToken(token));
    if (stored) await refreshTokenRepo.revokeFamily(stored.familyId); // idempotente
  },

  async me(userId: string): Promise<UserDto> {
    const user = await userRepo.findById(userId);
    if (!user) throw AppError.unauthorized();
    return toUserDto(user);
  },
};
