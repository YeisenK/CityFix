import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

describe('rate limit', () => {
  it('responde 429 con el formato de error tras superar el límite', async () => {
    vi.stubEnv('RATE_LIMIT_IN_TESTS', 'true');
    vi.resetModules();
    const { authLimiter } = await import('../src/middlewares/rateLimit');
    const app = express();
    app.post('/login', authLimiter(3), (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 3; i++) expect((await request(app).post('/login')).status).toBe(200);
    const blocked = await request(app).post('/login');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    expect(blocked.headers['ratelimit']).toBeDefined();
    vi.unstubAllEnvs();
  });
});
