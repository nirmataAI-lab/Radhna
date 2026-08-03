import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const extractedMenu = [
  {
    category: 'Starters',
    items: [
      { name: 'Paneer Tikka', price: 200, isVeg: true },
      { name: 'Samosa (2 pcs)', price: 120, isVeg: true },
      { name: 'Hara Bhara Kebab', price: 180, isVeg: true },
      { name: 'Chicken Tikka', price: 250, isVeg: false },
    ]
  },
  {
    category: 'Main Course',
    items: [
      { name: 'Butter Chicken', price: 300, isVeg: false },
      { name: 'Palak Paneer', price: 240, isVeg: true },
      { name: 'Dal Makhani', price: 190, isVeg: true },
      { name: 'Lamb Rogan Josh', price: 380, isVeg: false },
      { name: 'Lamb Paneer', price: 290, isVeg: false },
    ]
  },
  {
    category: 'Breads & Rice',
    items: [
      { name: 'Garlic Naan', price: 50, isVeg: true },
      { name: 'Tandoori Roti', price: 30, isVeg: true },
      { name: 'Laccha Paratha', price: 40, isVeg: true },
      { name: 'Jeera Rice', price: 150, isVeg: true },
      { name: 'Chicken Biryani', price: 280, isVeg: false },
    ]
  },
  {
    category: 'Drinks & Desserts',
    items: [
      { name: 'Mango Lassi', price: 80, isVeg: true },
      { name: 'Masala Chai', price: 60, isVeg: true },
      { name: 'Gulab Jamun', price: 120, isVeg: true },
    ]
  }
];

async function main() {
  for (const cat of extractedMenu) {
    let categoryRecord = await prisma.category.findFirst({ where: { name: cat.category }});
    if (!categoryRecord) {
      categoryRecord = await prisma.category.create({
        data: { name: cat.category },
      });
      console.log(`Created category: ${cat.category}`);
    }
    
    for (const item of cat.items) {
      const exists = await prisma.foodItem.findFirst({ where: { name: item.name }});
      if (!exists) {
        await prisma.foodItem.create({
          data: {
            name: item.name,
            description: `Delicious ${item.name} from our new menu.`,
            price: item.price,
            categoryId: categoryRecord.id,
            isVeg: item.isVeg,
            isEnabled: true,
          }
        });
        console.log(`Added ${item.name} (₹${item.price})`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
