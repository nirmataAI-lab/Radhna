import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'admin@restaurant.com' } });
  console.log('User:', user?.email, user?.passwordHash);
  if (user && user.passwordHash) {
    const match = await bcrypt.compare('dev-password-123', user.passwordHash);
    console.log('Password match:', match);
  }
}
main();
