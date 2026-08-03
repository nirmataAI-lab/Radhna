import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const customerId = 'test';
  const customerEmail = 'test@example.com';
  const conditions: Prisma.OrderWhereInput[] = [];
  if (customerId) conditions.push({ customerId });
  if (customerEmail) conditions.push({ customer: { email: customerEmail } });
  const res = await prisma.order.findMany({ where: { OR: conditions } });
  console.log('Success:', res.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
