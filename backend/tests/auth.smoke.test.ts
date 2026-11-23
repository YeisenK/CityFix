import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { resetDb } from './helpers';

const email = `smoke-${Date.now()}@test.local`;
const password = 'Password123';

beforeAll(resetDb);
afterAll(() => prisma.$disconnect());

describe('auth smoke', () => {
  let access = '';
  let refresh = '';

  it('register devuelve usuario sin hash', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Smoke', email, password });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rechaza email duplicado y datos inválidos', async () => {
    expect((await request(app).post('/api/auth/register').send({ name: 'Smoke', email, password })).status).toBe(409);
    expect((await request(app).post('/api/auth/register').send({ email: 'x' })).status).toBe(400);
  });

  it('login ok / credenciales malas', async () => {
    expect((await request(app).post('/api/auth/login').send({ email, password: 'wrong-pass' })).status).toBe(401);
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    access = res.body.accessToken;
    refresh = res.body.refreshToken;
  });

  it('/me exige token y funciona con él', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${access}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it('refresh rota y detecta reuso revocando la familia', async () => {
    const r1 = await request(app).post('/api/auth/refresh').send({ refreshToken: refresh });
    expect(r1.status).toBe(200);
    expect(r1.body.refreshToken).not.toBe(refresh);

    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: refresh });
    expect(reuse.status).toBe(401);

    // el token nuevo de la misma familia también quedó revocado
    const r2 = await request(app).post('/api/auth/refresh').send({ refreshToken: r1.body.refreshToken });
    expect(r2.status).toBe(401);
  });

  it('logout revoca el refresh token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password });
    const rt = login.body.refreshToken;
    expect((await request(app).post('/api/auth/logout').send({ refreshToken: rt })).status).toBe(204);
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: rt })).status).toBe(401);
  });
});
