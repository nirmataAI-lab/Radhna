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
  const items = await prisma.foodItem.findMany({ where: { imageUrl: null } });
  for (const item of items) {
    let fallback = '/images/menu/chole_bhature.png';
    const name = item.name.toLowerCase();
    
    if (name.includes('lassi') || name.includes('chai') || name.includes('jamun')) {
      fallback = '/images/menu/real_lassi.png';
    } else if (name.includes('tikka') || name.includes('kebab')) {
      fallback = '/images/menu/real_uttapam.png';
    }

    await prisma.foodItem.update({
      where: { id: item.id },
      data: { imageUrl: fallback }
    });
    console.log(`Updated ${item.name} -> ${fallback}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
