import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';

const handler = (message: string) =>
  ((_req: unknown, res: any) =>
    res.status(429).json({ error: { code: 'RATE_LIMITED', message } })) as any;

const make = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: handler(message),
    skip: () => env.NODE_ENV === 'test' && !env.RATE_LIMIT_IN_TESTS,
  });

/** Fuerza bruta: login y registro. */
export const authLimiter = (limit = env.AUTH_RATE_LIMIT_MAX) =>
  make(15 * 60_000, limit, 'Demasiados intentos, intenta de nuevo en unos minutos');

/** Límite general de la API. */
export const apiLimiter = make(60_000, env.API_RATE_LIMIT_MAX, 'Demasiadas solicitudes, intenta de nuevo en un momento');
