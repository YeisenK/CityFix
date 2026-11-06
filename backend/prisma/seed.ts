import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  for (const name of ['Bache', 'Alumbrado', 'Basura', 'Agua / Drenaje', 'Señalización', 'Otro']) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  const email = process.env.ADMIN_EMAIL ?? 'admin@cityfix.local';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin1234!';
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: 'Admin', email, passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' },
  });
  console.log(`Seed OK. Admin: ${email}`);
}
main().finally(() => prisma.$disconnect());
