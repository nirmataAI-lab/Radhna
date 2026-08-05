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
    category: 'Maggi & Egg',
    order: 1,
    items: [
      { name: 'Plain Maggi', description: 'Classic comfort instant noodles prepared with signature spices.', price: 50, imageUrl: '/images/menu/butter_maggi.png', isVeg: true, stock: 50 },
      { name: 'Butter Maggi', description: 'Delicious noodles tossed with generous dollop of butter.', price: 70, imageUrl: '/images/menu/butter_maggi.png', isVeg: true, stock: 50 },
      { name: 'Cheese Maggi (Single)', description: 'Topped with melted cheese for extra richness.', price: 100, imageUrl: '/images/menu/butter_maggi.png', isVeg: true, isPopular: true, stock: 40 },
      { name: 'Cheese Maggi (Double)', description: 'Double layer of melted cheese and noodles.', price: 120, imageUrl: '/images/menu/butter_maggi.png', isVeg: true, stock: 35 },
      { name: 'Egg Maggi (Single)', description: 'Maggi scrambled with fresh eggs and herbs.', price: 100, imageUrl: '/images/menu/butter_maggi.png', isVeg: false, stock: 40 },
      { name: 'Egg Maggi (Double)', description: 'Double egg scrambled with noodles.', price: 120, imageUrl: '/images/menu/butter_maggi.png', isVeg: false, stock: 35 },
      { name: 'Cheese Egg Maggi (Single)', description: 'Loaded with scrambled eggs and melted cheese.', price: 120, imageUrl: '/images/menu/butter_maggi.png', isVeg: false, isPopular: true, stock: 30 },
      { name: 'Cheese Egg Maggi (Double)', description: 'Ultimate combination of double egg and double cheese.', price: 140, imageUrl: '/images/menu/butter_maggi.png', isVeg: false, stock: 25 },
    ],
  },
  {
    category: 'Plain Dosa',
    order: 2,
    items: [
      { name: 'Plain Dosa', description: 'Crispy golden rice crepes served with sambar and coconut chutney.', price: 80, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 50 },
      { name: 'Butter Plain Dosa', description: 'Crispy crepe roasted with rich butter.', price: 100, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, isPopular: true, stock: 45 },
      { name: 'Cheese Plain Dosa', description: 'Golden dosa loaded with gooey grated cheese.', price: 120, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 40 },
      { name: 'Paneer Plain Dosa', description: 'Crispy crepe filled with fresh cottage cheese crumble.', price: 120, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 40 },
      { name: 'Special Plain Dosa', description: 'Chef special crispy plain dosa served with assortment of chutneys.', price: 140, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 30 },
      { name: 'Mysore Plain Dosa', description: 'Spread with fiery spicy red garlic red chutney inside.', price: 110, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 35 },
      { name: 'Butter Mysore Plain Dosa', description: 'Mysore spicy paste roasted in Amul butter.', price: 130, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 35 },
      { name: 'Cheese Mysore Plain Dosa', description: 'Spicy Mysore plain dosa topped with cheese.', price: 140, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 30 },
      { name: 'Schezwan Plain Dosa', description: 'Tangy and spicy Schezwan sauce spread.', price: 110, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 30 },
      { name: 'Cheese Schezwan Plain Dosa', description: 'Schezwan flavor infused with melted cheese.', price: 140, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 30 },
      { name: 'Butter Schezwan Plain Dosa', description: 'Schezwan flavored crepe roasted in butter.', price: 130, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 30 },
      { name: 'Butter Paneer Plain Dosa', description: 'Paneer crumble roasted with butter.', price: 140, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 25 },
      { name: 'Cheese Paneer Plain Dosa', description: 'Combination of fresh paneer and melted cheese.', price: 150, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 25 },
      { name: 'Butter Cheese Paneer Plain Dosa', description: 'Ultimate combination of butter, cheese, and paneer.', price: 160, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, isPopular: true, stock: 25 },
    ],
  },
  {
    category: 'Masala Dosa',
    order: 3,
    items: [
      { name: 'Paper Masala Dosa', description: 'Super thin crispy paper crepe stuffed with spiced potato masala.', price: 110, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 50 },
      { name: 'Butter Masala Dosa', description: 'Classic potato masala dosa roasted in Amul butter.', price: 130, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, isPopular: true, stock: 50 },
      { name: 'Cheese Masala Dosa', description: 'Potato masala stuffed dosa melted with cheese.', price: 150, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, isPopular: true, stock: 40 },
      { name: 'Paneer Masala Dosa', description: 'Stuffed with potato masala and fresh cottage cheese.', price: 150, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 40 },
      { name: 'Special Masala Dosa', description: 'Signature Radhna special spiced potato masala dosa.', price: 170, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, isPopular: true, stock: 35 },
      { name: 'Mysore Masala Dosa', description: 'Layered with Mysore red spicy paste and potato masala.', price: 140, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 35 },
      { name: 'Butter Mysore Masala Dosa', description: 'Spicy Mysore masala dosa cooked with butter.', price: 160, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 35 },
      { name: 'Cheese Mysore Dosa', description: 'Mysore masala stuffed with grated cheese.', price: 170, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 30 },
      { name: 'Schezwan Masala Dosa', description: 'Potato masala dosa infused with Schezwan sauce.', price: 140, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 30 },
      { name: 'Cheese Schezwan Masala Dosa', description: 'Schezwan masala dosa generously topped with cheese.', price: 170, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 30 },
      { name: 'Butter Schezwan Masala Dosa', description: 'Schezwan masala dosa roasted with butter.', price: 160, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 30 },
      { name: 'Butter Paneer Masala Dosa', description: 'Potato and paneer masala fried with rich butter.', price: 170, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 25 },
      { name: 'Cheese Paneer Masala Dosa', description: 'Rich potato, paneer, and melted cheese stuffing.', price: 180, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, isPopular: true, stock: 25 },
    ],
  },
  {
    category: 'Uttapam',
    order: 4,
    items: [
      { name: 'Plain Uttapam', description: 'Thick and fluffy South Indian rice pancake.', price: 90, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, stock: 40 },
      { name: 'Onion Uttapam', description: 'Thick pancake topped with finely chopped onions and herbs.', price: 110, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, isPopular: true, stock: 40 },
      { name: 'Mix Veg Uttapam', description: 'Topped with onions, tomatoes, capsicum, and carrots.', price: 130, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, isPopular: true, stock: 35 },
      { name: 'Sweet Corn Uttapam', description: 'Loaded with juicy sweet corn kernels.', price: 120, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, stock: 30 },
      { name: 'Fresh Paneer Uttapam', description: 'Topped with fresh cottage cheese cubes and coriander.', price: 140, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, stock: 30 },
      { name: 'Cheese Uttapam', description: 'Thick uttapam smothered with melted cheese.', price: 130, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, stock: 30 },
    ],
  },
  {
    category: 'Rava Dosa',
    order: 5,
    items: [
      { name: 'Special Rava Dosa', description: 'Lacy, net-like crispy semolina crepe.', price: 100, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 35 },
      { name: 'Rava Masala Dosa', description: 'Crispy Rava crepe stuffed with potato masala.', price: 120, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, isPopular: true, stock: 35 },
      { name: 'Rava Onion Dosa', description: 'Infused with roasted chopped onions and green chillies.', price: 120, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 35 },
      { name: 'Rava Onion Masala Dosa', description: 'Onion rava crepe stuffed with potato masala.', price: 140, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, isPopular: true, stock: 30 },
      { name: 'Rava Paneer Dosa', description: 'Crispy semolina dosa topped with paneer.', price: 140, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 30 },
      { name: 'Rava Paneer Masala Dosa', description: 'Loaded with potato masala and fresh paneer.', price: 160, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 25 },
      { name: 'Rava Cheese Butter Masala Dosa', description: 'Rich semolina dosa with butter, cheese, and potato masala.', price: 160, imageUrl: '/images/menu/masala_dosa.png', isVeg: true, stock: 25 },
    ],
  },
  {
    category: 'Snacks & South Indian',
    order: 6,
    items: [
      { name: 'Idli (2 Pcs)', description: 'Soft steamed rice cakes served with sambar and coconut chutney.', price: 60, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, isPopular: true, stock: 50 },
      { name: 'Sambar Idli', description: 'Steamed idlis submerged in hot aromatic sambar.', price: 80, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, stock: 45 },
      { name: 'Fry Idli', description: 'Crispy fried idli cubes tossed with curry leaves and mustard seeds.', price: 90, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, stock: 40 },
      { name: 'Butter Fry Idli', description: 'Idli cubes tossed in butter and spicy South Indian podi.', price: 110, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, isPopular: true, stock: 35 },
      { name: 'Masala Idli', description: 'Idlis fried with tangy tomato-onion masala.', price: 120, imageUrl: '/images/menu/onion_uttapam.png', isVeg: true, stock: 35 },
      { name: 'Puri Bhaji', description: 'Deep-fried fluffy bread served with flavorful potato gravy.', price: 90, imageUrl: '/images/menu/chole_bhature.png', isVeg: true, isPopular: true, stock: 40 },
      { name: 'Chole Bhature', description: 'Large fried bread served with spicy chickpea curry.', price: 120, imageUrl: '/images/menu/chole_bhature.png', isVeg: true, isPopular: true, stock: 40 },
    ],
  },
  {
    category: 'Lassi',
    order: 7,
    items: [
      { name: 'Sweet Lassi', description: 'Traditional creamy churned yogurt drink sweetened with cardamom.', price: 60, imageUrl: '/images/menu/mango_lassi.png', isVeg: true, stock: 50 },
      { name: 'Salted Lassi', description: 'Refreshing savory yogurt drink spiced with roasted cumin.', price: 60, imageUrl: '/images/menu/mango_lassi.png', isVeg: true, stock: 50 },
      { name: 'Dry Fruit Lassi', description: 'Rich lassi blended with almonds, pistachios, and cashew nuts.', price: 110, imageUrl: '/images/menu/mango_lassi.png', isVeg: true, isPopular: true, stock: 30 },
      { name: 'Mango Lassi', description: 'Creamy lassi blended with sweet Alphonso mango pulp.', price: 90, imageUrl: '/images/menu/mango_lassi.png', isVeg: true, isPopular: true, stock: 40 },
      { name: 'Strawberry Lassi', description: 'Yogurt drink infused with fresh strawberry flavor.', price: 90, imageUrl: '/images/menu/mango_lassi.png', isVeg: true, stock: 35 },
      { name: 'Rose Lassi', description: 'Fragrant lassi flavored with natural rose syrup.', price: 80, imageUrl: '/images/menu/mango_lassi.png', isVeg: true, stock: 35 },
      { name: 'Paan Lassi', description: 'Unique refreshing lassi blended with betel leaf and gulkand.', price: 100, imageUrl: '/images/menu/mango_lassi.png', isVeg: true, stock: 30 },
      { name: 'Kesar Lassi', description: 'Rich saffron infused thick lassi.', price: 110, imageUrl: '/images/menu/mango_lassi.png', isVeg: true, stock: 30 },
    ],
  },
  {
    category: 'Drinks & Shakes',
    order: 8,
    items: [
      { name: 'Cold Coffee', description: 'Chilled blended espresso with thick milk and ice cream.', price: 90, imageUrl: '/images/menu/cold_coffee.png', isVeg: true, isPopular: true, stock: 50 },
      { name: 'Chocolate Shake', description: 'Rich chocolate milkshake topped with cocoa powder.', price: 110, imageUrl: '/images/menu/cold_coffee.png', isVeg: true, stock: 40 },
      { name: 'Oreo Shake', description: 'Thick shake blended with crunchy Oreo cookies.', price: 120, imageUrl: '/images/menu/cold_coffee.png', isVeg: true, isPopular: true, stock: 40 },
      { name: 'Badam Milk', description: 'Traditional almond flavored chilled milk.', price: 80, imageUrl: '/images/menu/cold_coffee.png', isVeg: true, stock: 40 },
      { name: 'Fresh Lime Water', description: 'Hydrating fresh lemon juice with salt or sugar.', price: 50, imageUrl: '/images/menu/cold_coffee.png', isVeg: true, stock: 60 },
      { name: 'Fresh Lime Soda', description: 'Fizzy sparkling lemon soda.', price: 70, imageUrl: '/images/menu/cold_coffee.png', isVeg: true, stock: 50 },
      { name: 'Mango Smoothie', description: 'Refreshing blended mango fruit smoothie.', price: 120, imageUrl: '/images/menu/mango_lassi.png', isVeg: true, stock: 30 },
      { name: 'Strawberry Smoothie', description: 'Chilled blended strawberry smoothie.', price: 120, imageUrl: '/images/menu/mango_lassi.png', isVeg: true, stock: 30 },
    ],
  },
];

async function main() {
  console.log('Clearing old data...');
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
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

  console.log('Seeding Radhna Cuisine Authentic Menu with Real Generated Dish Images...');
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
          productionStock: { create: { availableQty: item.stock ?? 30 } },
        },
      });
      totalItems += 1;
    }
    console.log(`  ✓ ${group.category}: ${group.items.length} items`);
  }

  console.log(`Radhna Cuisine Real Image Seeding Complete! 🌱 ${MENU.length} categories, ${totalItems} authentic menu items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
