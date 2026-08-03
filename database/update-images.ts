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
  const items = await prisma.foodItem.findMany();
  for (const item of items) {
    let newUrl = item.imageUrl;
    const name = item.name.toLowerCase();
    if (name.includes('dosa')) {
      newUrl = '/images/menu/real_dosa.png';
    } else if (name.includes('uttapam')) {
      newUrl = '/images/menu/real_uttapam.png';
    } else if (name.includes('maggi')) {
      newUrl = '/images/menu/real_maggi.png';
    } else if (name.includes('idli')) {
      newUrl = '/images/menu/real_idli.png';
    } else if (name.includes('shake') || name.includes('coffee') || name.includes('chole') || name.includes('bhature')) {
      newUrl = '/images/menu/real_shake.png';
    } else if (name.includes('lassi')) {
      newUrl = '/images/menu/real_lassi.png';
    }
    
    if (newUrl !== item.imageUrl) {
      await prisma.foodItem.update({
        where: { id: item.id },
        data: { imageUrl: newUrl },
      });
      console.log(`Updated ${item.name}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
