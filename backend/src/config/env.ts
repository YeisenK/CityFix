import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(7),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_IN_TESTS: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  // cantidad de proxies de confianza (p.ej. 1 detrás de nginx) para que el rate limit use la IP real
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  UPLOAD_DIR: z.string().default('uploads'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
