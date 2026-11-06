import type { RequestHandler } from 'express';
import type { Role } from '@cityfix/shared';
import { AppError } from '../lib/AppError';
import { verifyAccessToken } from '../services/token.service';

declare global {
  namespace Express {
    interface Request { user?: { id: string; role: Role } }
  }
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(AppError.unauthorized());
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized('Token inválido o expirado'));
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
