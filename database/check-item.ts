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
  const item = await prisma.foodItem.findUnique({
    where: { id: "9c0554cd-6056-4bbb-9479-58a36ec3aa75" }
  });
  console.log("ITEM:", item);
}

main().catch(console.error).finally(() => prisma.$disconnect());
