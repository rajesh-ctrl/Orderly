// import { prisma } from './lib/prisma'

// async function main() {
//   // Create a new user with a post
//   const user = await prisma.user.create({
//     data: {
//       name: 'Alice',
//       email: 'alice@prisma.io',
//       posts: {
//         create: {
//           title: 'Hello World',
//           content: 'This is my first post!',
//           published: true,
//         },
//       },
//     },
//     include: {
//       posts: true,
//     },
//   })
//   console.log('Created user:', user)

//   // Fetch all users with their posts
//   const allUsers = await prisma.user.findMany({
//     include: {
//       posts: true,
//     },
//   })
//   console.log('All users:', JSON.stringify(allUsers, null, 2))
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect()
//   })
//   .catch(async (e) => {
//     console.error(e)
//     await prisma.$disconnect()
//     process.exit(1)
//   })


import { prisma } from './lib/prisma';

// const prisma = new Prisma();
async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Products
  const products = await prisma.product.createMany({
    data: [
      { name: 'Laptop', price: 55000, stock: 50 },
      { name: 'Smartphone', price: 25000, stock: 100 },
      { name: 'Headphones', price: 1500, stock: 200 },
      { name: 'Keyboard', price: 1200, stock: 150 },
      { name: 'Mouse', price: 800, stock: 180 },
    ],
  });
  console.log(`✅ Seeded ${products.count} products`);

  // 2. Create an Order
  const order = await prisma.order.create({
    data: {
      customerName: 'Rajesh Kumar',
      status: 'Pending',
      totalAmount: 0, // Will update after adding items
    },
  });

  // Generate Invoice Number
  const invoiceNumber = `INV-${new Date().getFullYear()}-${order.id
    .toString()
    .padStart(4, '0')}`;

  await prisma.order.update({
    where: { id: order.id },
    data: { invoiceNumber },
  });

  // 3. Add Order Items
  const laptop = await prisma.product.findFirst({ where: { name: 'Laptop' } });
  const phone = await prisma.product.findFirst({ where: { name: 'Smartphone' } });

  if (laptop && phone) {
    await prisma.orderItem.createMany({
      data: [
        {
          orderId: order.id,
          productId: laptop.id,
          quantity: 2,
          defaultPrice: laptop.price,
          sellingPrice: 53000, // Discounted price
        },
        {
          orderId: order.id,
          productId: phone.id,
          quantity: 1,
          defaultPrice: phone.price,
          sellingPrice: 24000,
        },
      ],
    });

    // Update total amount
    const totalAmount = 2 * 53000 + 1 * 24000;
    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount },
    });

    // Update stock
    await prisma.product.update({
      where: { id: laptop.id },
      data: { stock: { decrement: 2 } },
    });
    await prisma.product.update({
      where: { id: phone.id },
      data: { stock: { decrement: 1 } },
    });
  }

  console.log('✅ Seeded one order with items');
}

main()
  .then(() => {
    console.log('🌱 Seeding completed!');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
