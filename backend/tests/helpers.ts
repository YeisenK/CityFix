import bcrypt from 'bcryptjs';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

export const api = () => request(app);

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "RefreshToken","StatusHistory","Comment","Report","Category","User" RESTART IDENTITY CASCADE',
  );
}

export async function makeUser(role: 'CITIZEN' | 'ADMIN', email: string) {
  const password = 'Password123';
  const user = await prisma.user.create({
    data: { name: email.split('@')[0], email, role, passwordHash: await bcrypt.hash(password, 4) },
  });
  const res = await api().post('/api/auth/login').send({ email, password });
  return { user, token: res.body.accessToken as string, auth: { Authorization: `Bearer ${res.body.accessToken}` } };
}

// 1x1 PNG válido
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
