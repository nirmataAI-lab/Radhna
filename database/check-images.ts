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
  const items = await prisma.foodItem.findMany({
    select: { name: true, imageUrl: true }
  });
  console.log(items);
}

main().catch(console.error).finally(() => prisma.$disconnect());
