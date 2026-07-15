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

type SeedItem = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  isPopular?: boolean;
  stock?: number;
};

const MENU: { category: string; order: number; items: SeedItem[] }[] = [
  {
    category: 'Starters',
    order: 1,
    items: [
      { name: 'Garlic Bread', description: 'Crispy bread with garlic butter and herbs.', price: 5.99, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600', isVeg: true, isPopular: true, stock: 30 },
      { name: 'Bruschetta', description: 'Grilled bread topped with tomato, basil and olive oil.', price: 6.5, imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600', isVeg: true, stock: 25 },
      { name: 'Mozzarella Sticks', description: 'Golden fried mozzarella with marinara dip.', price: 7.25, imageUrl: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=600', isVeg: true, stock: 25 },
      { name: 'Chicken Wings', description: 'Spicy buffalo wings with blue cheese sauce.', price: 9.99, imageUrl: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600', isVeg: false, isPopular: true, stock: 40 },
      { name: 'Paneer Tikka', description: 'Chargrilled cottage cheese in tandoori spices.', price: 8.5, imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600', isVeg: true, stock: 30 },
      { name: 'Spring Rolls', description: 'Crispy veggie rolls with sweet chilli sauce.', price: 6.75, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', isVeg: true, stock: 30 },
    ],
  },
  {
    category: 'Main Course',
    order: 2,
    items: [
      { name: 'Classic Cheeseburger', description: 'Juicy beef patty, cheddar, lettuce, tomato, brioche bun.', price: 12.99, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', isVeg: false, isPopular: true, stock: 50 },
      { name: 'Margherita Pizza', description: 'San Marzano tomato, fresh mozzarella, basil.', price: 14.99, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600', isVeg: true, isPopular: true, stock: 25 },
      { name: 'Pepperoni Pizza', description: 'Classic pepperoni with molten mozzarella.', price: 16.5, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600', isVeg: false, stock: 25 },
      { name: 'Grilled Chicken Alfredo', description: 'Fettuccine tossed in creamy parmesan sauce.', price: 15.75, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600', isVeg: false, stock: 20 },
      { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato-cashew gravy.', price: 13.5, imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600', isVeg: true, stock: 30 },
      { name: 'Chicken Biryani', description: 'Basmati rice layered with spiced chicken and saffron.', price: 14.5, imageUrl: 'https://images.unsplash.com/photo-1633945274309-2c16c5c0e3b6?w=600', isVeg: false, isPopular: true, stock: 35 },
      { name: 'Veg Biryani', description: 'Fragrant basmati with mixed vegetables and whole spices.', price: 12.5, imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600', isVeg: true, stock: 30 },
      { name: 'Fish & Chips', description: 'Beer-battered cod with hand-cut fries and tartar sauce.', price: 15.99, imageUrl: 'https://images.unsplash.com/photo-1580217593608-61931cefc821?w=600', isVeg: false, stock: 20 },
    ],
  },
  {
    category: 'Sides',
    order: 3,
    items: [
      { name: 'French Fries', description: 'Golden crispy fries with sea salt.', price: 4.5, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600', isVeg: true, isPopular: true, stock: 60 },
      { name: 'Onion Rings', description: 'Crunchy battered rings with dipping sauce.', price: 4.99, imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600', isVeg: true, stock: 40 },
      { name: 'Garden Salad', description: 'Mixed greens, cherry tomatoes, cucumber, vinaigrette.', price: 6.25, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', isVeg: true, stock: 20 },
      { name: 'Mashed Potatoes', description: 'Creamy Yukon golds with butter and chives.', price: 5.5, imageUrl: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600', isVeg: true, stock: 25 },
    ],
  },
  {
    category: 'Desserts',
    order: 4,
    items: [
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center and vanilla ice cream.', price: 8.99, imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600', isVeg: true, isPopular: true, stock: 15 },
      { name: 'New York Cheesecake', description: 'Classic baked cheesecake with berry compote.', price: 7.5, imageUrl: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600', isVeg: true, stock: 15 },
      { name: 'Tiramisu', description: 'Espresso-soaked ladyfingers with mascarpone cream.', price: 7.99, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600', isVeg: true, stock: 12 },
      { name: 'Gulab Jamun', description: 'Warm milk dumplings in rose-cardamom syrup.', price: 5.5, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', isVeg: true, stock: 30 },
      { name: 'Vanilla Ice Cream', description: 'Two scoops of Madagascar vanilla.', price: 4.5, imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600', isVeg: true, stock: 40 },
    ],
  },
  {
    category: 'Beverages',
    order: 5,
    items: [
      { name: 'Fresh Lime Soda', description: 'Sparkling lime with mint, sweet or salted.', price: 3.5, imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600', isVeg: true, stock: 50 },
      { name: 'Mango Lassi', description: 'Creamy yogurt smoothie with alphonso mango.', price: 4.25, imageUrl: 'https://images.unsplash.com/photo-1571805529673-0f56b922b359?w=600', isVeg: true, isPopular: true, stock: 30 },
      { name: 'Cold Brew Coffee', description: 'Slow-steeped 18h cold brew, served over ice.', price: 4.75, imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600', isVeg: true, stock: 40 },
      { name: 'Masala Chai', description: 'Spiced black tea simmered with milk.', price: 3.25, imageUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600', isVeg: true, stock: 60 },
      { name: 'Fresh Orange Juice', description: 'Cold-pressed, 100% pure orange juice.', price: 4.5, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600', isVeg: true, stock: 40 },
      { name: 'Sparkling Water', description: 'Chilled sparkling mineral water.', price: 2.75, imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600', isVeg: true, stock: 80 },
    ],
  },
];

async function main() {
  console.log('Clearing old data...');
  await prisma.productionStock.deleteMany();
  await prisma.foodItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');
  const seedPassword = process.env.SEED_PASSWORD || 'dev-password-123';
  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  await prisma.user.create({
    data: { name: 'Super Admin', email: 'admin@restaurant.com', passwordHash: hashedPassword, role: Role.SUPER_ADMIN },
  });
  await prisma.user.create({
    data: { name: 'Head Chief', email: 'chief@restaurant.com', passwordHash: hashedPassword, role: Role.CHIEF },
  });

  console.log('Seeding Categories & Items...');
  let totalItems = 0;
  for (const group of MENU) {
    const cat = await prisma.category.create({
      data: { name: group.category, displayOrder: group.order },
    });
    for (const item of group.items) {
      await prisma.foodItem.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          categoryId: cat.id,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          isPopular: item.isPopular ?? false,
          productionStock: { create: { availableQty: item.stock ?? 20 } },
        },
      });
      totalItems += 1;
    }
    console.log(`  ✓ ${group.category}: ${group.items.length} items`);
  }

  console.log(`Seeding complete! 🌱  ${MENU.length} categories, ${totalItems} items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
