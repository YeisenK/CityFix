import { app } from './app';
import { env } from './config/env';
import { authService } from './services/auth.service';

const CLEANUP_EVERY_MS = 60 * 60 * 1000;

async function cleanup() {
  try {
    const n = await authService.cleanupExpiredTokens();
    if (n) console.log(`Limpieza: ${n} refresh tokens expirados eliminados`);
  } catch (e) {
    console.error('Error en la limpieza de refresh tokens', e);
  }
}

app.listen(env.PORT, () => console.log(`CityFix API en http://localhost:${env.PORT}/api`));
void cleanup();
setInterval(cleanup, CLEANUP_EVERY_MS).unref();
