import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { TEST_DB_URL } from '../vitest.config';

// Crea (si no existe) y migra la BD aislada de tests; nunca toca la de desarrollo.
export default function setup() {
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: TEST_DB_URL }, stdio: 'pipe' });
  return () => fs.rmSync('tests/.uploads', { recursive: true, force: true });
}
