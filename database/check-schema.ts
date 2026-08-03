import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const users = await prisma.$queryRaw`SELECT * FROM "User" LIMIT 1`;
    console.log("USERS:", users);
  } catch (e) {
    console.error("ERROR:", e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
