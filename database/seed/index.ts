import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing old data...');
  await prisma.productionStock.deleteMany();
  await prisma.foodItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.table.deleteMany();

  console.log('Seeding Users...');
  const seedPassword = process.env.SEED_PASSWORD || 'dev-password-123';
  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@restaurant.com',
      passwordHash: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  const chief = await prisma.user.create({
    data: {
      name: 'Head Chief',
      email: 'chief@restaurant.com',
      passwordHash: hashedPassword,
      role: Role.CHIEF,
    },
  });

  console.log('Seeding Categories...');
  const starters = await prisma.category.create({
    data: { name: 'Starters', displayOrder: 1 },
  });
  const mains = await prisma.category.create({
    data: { name: 'Main Course', displayOrder: 2 },
  });
  const desserts = await prisma.category.create({
    data: { name: 'Desserts', displayOrder: 3 },
  });

  console.log('Seeding Food Items & Stock...');
  await prisma.foodItem.create({
    data: {
      name: 'Garlic Bread',
      description: 'Crispy bread with garlic and herbs.',
      price: 5.99,
      categoryId: starters.id,
      imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500',
      isVeg: true,
      productionStock: {
        create: { availableQty: 20 },
      },
    },
  });

  await prisma.foodItem.create({
    data: {
      name: 'Classic Burger',
      description: 'Juicy beef patty with cheese and lettuce.',
      price: 12.99,
      categoryId: mains.id,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
      isVeg: false,
      productionStock: {
        create: { availableQty: 15 },
      },
    },
  });

  await prisma.foodItem.create({
    data: {
      name: 'Margherita Pizza',
      description: 'Fresh tomatoes, mozzarella, and basil.',
      price: 14.99,
      categoryId: mains.id,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500',
      isVeg: true,
      isPopular: true,
      productionStock: {
        create: { availableQty: 10 },
      },
    },
  });

  await prisma.foodItem.create({
    data: {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with a gooey center.',
      price: 8.99,
      categoryId: desserts.id,
      imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500',
      isVeg: true,
      productionStock: {
        create: { availableQty: 8 },
      },
    },
  });

  console.log('Seeding Tables...');
  for (let i = 1; i <= 5; i++) {
    await prisma.table.create({
      data: {
        tableNumber: `T${i}`,
        capacity: i % 2 === 0 ? 4 : 2,
      },
    });
  }

  console.log('Seeding complete! 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
