import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { authService } from '../src/services/auth.service';
import { makeUser, resetDb } from './helpers';

describe('limpieza de refresh tokens', () => {
  beforeAll(resetDb);
  afterAll(() => prisma.$disconnect());

  it('elimina solo los expirados', async () => {
    const { user } = await makeUser('CITIZEN', 'c@t.local'); // el login crea un token vigente
    const mk = (hash: string, ms: number) =>
      prisma.refreshToken.create({
        data: { userId: user.id, familyId: 'f', tokenHash: hash, expiresAt: new Date(Date.now() + ms) },
      });
    await mk('old1', -60_000);
    await mk('old2', -86_400_000);
    await mk('live', 60_000);

    expect(await authService.cleanupExpiredTokens()).toBe(2);
    const left = await prisma.refreshToken.findMany({ select: { tokenHash: true } });
    expect(left.map((t) => t.tokenHash)).toContain('live');
    expect(left.map((t) => t.tokenHash)).not.toContain('old1');
    expect(left).toHaveLength(2); // 'live' + el del login
  });
});
