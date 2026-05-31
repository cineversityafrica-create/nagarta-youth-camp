import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@campingnagartayouth.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@nagarta!';
  const name = process.env.ADMIN_NAME || 'Camp Administrator';

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hash, role: 'ADMIN', name },
    create: { email, password: hash, name, role: 'ADMIN' },
  });
  console.log('✅ Admin ready:', user.email);
  await prisma.$disconnect();
}

main().catch(console.error);
