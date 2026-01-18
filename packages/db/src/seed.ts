import prisma from './index';

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      name: 'John Doe',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
    },
  });

  console.log('✅ Created users');
  console.log('User IDs:', {
    johnDoe: user1.id,
    janeSmith: user2.id,
  });

  // Create orders
  const order1 = await prisma.order.upsert({
    where: { orderNumber: 'ORD-001' },
    update: {},
    create: {
      userId: user1.id,
      orderNumber: 'ORD-001',
      status: 'DELIVERED',
      total: 299.99,
      items: JSON.stringify([
        { name: 'Product A', quantity: 2, price: 149.99 },
      ]),
      delivery: {
        create: {
          status: 'DELIVERED',
          trackingId: 'TRACK-12345',
          carrier: 'UPS',
          deliveredAt: new Date('2024-01-15'),
        },
      },
    },
  });

  const order2 = await prisma.order.upsert({
    where: { orderNumber: 'ORD-002' },
    update: {},
    create: {
      userId: user1.id,
      orderNumber: 'ORD-002',
      status: 'SHIPPED',
      total: 149.50,
      items: JSON.stringify([
        { name: 'Product B', quantity: 1, price: 149.50 },
      ]),
      delivery: {
        create: {
          status: 'IN_TRANSIT',
          trackingId: 'TRACK-67890',
          carrier: 'FedEx',
          estimatedDelivery: new Date('2024-01-25'),
        },
      },
    },
  });

  const order3 = await prisma.order.upsert({
    where: { orderNumber: 'ORD-003' },
    update: {},
    create: {
      userId: user2.id,
      orderNumber: 'ORD-003',
      status: 'PROCESSING',
      total: 79.99,
      items: JSON.stringify([
        { name: 'Product C', quantity: 1, price: 79.99 },
      ]),
    },
  });

  const order4 = await prisma.order.upsert({
    where: { orderNumber: 'ORD-004' },
    update: {},
    create: {
      userId: user2.id,
      orderNumber: 'ORD-004',
      status: 'CANCELLED',
      total: 199.99,
      items: JSON.stringify([
        { name: 'Product D', quantity: 1, price: 199.99 },
      ]),
    },
  });

  console.log('✅ Created orders');

  // Create invoices
  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-001' },
    update: {},
    create: {
      userId: user1.id,
      invoiceNumber: 'INV-001',
      orderId: order1.id,
      amount: 299.99,
      status: 'PAID',
      items: JSON.stringify([
        { name: 'Product A', quantity: 2, price: 149.99 },
      ]),
      paidAt: new Date('2024-01-10'),
    },
  });

  const invoice2 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-002' },
    update: {},
    create: {
      userId: user1.id,
      invoiceNumber: 'INV-002',
      orderId: order2.id,
      amount: 149.50,
      status: 'PAID',
      items: JSON.stringify([
        { name: 'Product B', quantity: 1, price: 149.50 },
      ]),
      paidAt: new Date('2024-01-18'),
    },
  });

  const invoice3 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-003' },
    update: {},
    create: {
      userId: user2.id,
      invoiceNumber: 'INV-003',
      orderId: order3.id,
      amount: 79.99,
      status: 'PENDING',
      items: JSON.stringify([
        { name: 'Product C', quantity: 1, price: 79.99 },
      ]),
      dueDate: new Date('2024-02-01'),
    },
  });

  console.log('✅ Created invoices');

  // Create refunds
  try {
    await prisma.refund.upsert({
      where: { id: 'refund-1' },
      update: {},
      create: {
        id: 'refund-1',
        invoiceId: invoice2.id,
        amount: 149.50,
        status: 'COMPLETED',
        reason: 'Customer request',
        processedAt: new Date('2024-01-20'),
      },
    });
  } catch (e) {
    // Ignore if already exists
  }

  try {
    await prisma.refund.upsert({
      where: { id: 'refund-2' },
      update: {},
      create: {
        id: 'refund-2',
        invoiceId: invoice1.id,
        amount: 100.00,
        status: 'PROCESSING',
        reason: 'Partial refund for damaged item',
      },
    });
  } catch (e) {
    // Ignore if already exists
  }

  console.log('✅ Created refunds');

  // Create sample conversations
  const conversation1 = await prisma.conversation.create({
    data: {
      userId: user1.id,
      title: 'Order tracking inquiry',
      messages: {
        create: [
          {
            role: 'USER',
            content: 'Where is my order ORD-002?',
          },
          {
            role: 'ASSISTANT',
            content: 'Your order ORD-002 is currently in transit with FedEx. Tracking ID: TRACK-67890. Estimated delivery: January 25, 2024.',
            agentType: 'ORDER',
          },
        ],
      },
    },
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      userId: user1.id,
      title: 'Billing question',
      messages: {
        create: [
          {
            role: 'USER',
            content: 'I need a refund for invoice INV-002',
          },
          {
            role: 'ASSISTANT',
            content: 'I can see that you have a refund request for invoice INV-002 in the amount of $149.50. The refund status is COMPLETED and was processed on January 20, 2024.',
            agentType: 'BILLING',
          },
        ],
      },
    },
  });

  console.log('✅ Created conversations');

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });