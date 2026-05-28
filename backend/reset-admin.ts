import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@2026!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@nagartacamp.com' },
    update: { password: hash, role: 'ADMIN' },
    create: {
      email: 'admin@nagartacamp.com',
      password: hash,
      name: 'Camp Administrator',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin ready:', user.email);
  await prisma.$disconnect();
}

main().catch(console.error);
