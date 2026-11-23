import { defineConfig } from 'vitest/config';

export const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://cityfix:cityfix@localhost:5432/cityfix_test';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['tests/globalSetup.ts'],
    fileParallelism: false, // todos los archivos comparten la misma BD de test
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DB_URL,
      JWT_ACCESS_SECRET: 'test-secret-test-secret-test-secret-123',
      UPLOAD_DIR: 'tests/.uploads',
    },
    coverage: { provider: 'v8', include: ['src/**'], exclude: ['src/server.ts'] },
  },
});
