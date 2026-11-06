import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@cityfix/shared';
import { env } from '../config/env';

export interface AccessPayload { sub: string; role: Role }

export const signAccessToken = (userId: string, role: Role) =>
  jwt.sign({ role }, env.JWT_ACCESS_SECRET, { subject: userId, expiresIn: env.ACCESS_TTL as any });

export const verifyAccessToken = (token: string): AccessPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;

// Refresh token opaco: 48 bytes aleatorios; en BD solo se guarda su SHA-256.
export const generateRefreshToken = () => crypto.randomBytes(48).toString('base64url');
export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
