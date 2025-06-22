import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding (Static Token Auth)...');

  // Clear existing data
  await prisma.user.deleteMany();
  await prisma.event.deleteMany();

  // Create users with static token IDs (matching authentication)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@example.com',
      },
    }),
    prisma.user.create({
      data: {
        id: 'john-user-id',
        name: 'John Smith',
        email: 'john@example.com',
      },
    }),
    prisma.user.create({
      data: {
        id: 'jane-user-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
    }),
    prisma.user.create({
      data: {
        id: 'alice-user-id',
        name: 'Alice Johnson',
        email: 'alice@example.com',
      },
    }),
    prisma.user.create({
      data: {
        id: 'bob-user-id',
        name: 'Bob Wilson',
        email: 'bob@example.com',
      },
    }),
  ]);

  console.log('✅ Created users:', users.map(u => u.email).join(', '));

  // Create sample events
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setHours(18, 30, 0, 0);

  const events = await Promise.all([
    prisma.event.create({
      data: {
        name: 'React Native Meetup',
        location: 'Tech Hub, Downtown',
        startTime: tomorrow,
        attendees: {
          connect: [
            { id: users[0].id },
            { id: users[1].id },
            { id: users[2].id },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        name: 'GraphQL Workshop',
        location: 'Innovation Center, 2nd Floor',
        startTime: nextWeek,
        attendees: {
          connect: [
            { id: users[1].id },
            { id: users[3].id },
            { id: users[4].id },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        name: 'TypeScript Deep Dive',
        location: 'Virtual Event (Zoom)',
        startTime: nextMonth,
        attendees: {
          connect: [
            { id: users[2].id },
            { id: users[4].id },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        name: 'Web3 & Blockchain Seminar',
        location: 'Blockchain Hub, Conference Room A',
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        attendees: {
          connect: [
            { id: users[0].id },
            { id: users[3].id },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        name: 'Open Source Contribution Workshop',
        location: 'Community Center, Main Hall',
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        attendees: {
          connect: [
            { id: users[1].id },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        name: 'AI/ML for Developers',
        location: 'AI Research Lab, Building B',
        startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        attendees: {
          connect: [],
        },
      },
    }),
  ]);

  console.log('✅ Created events:', events.map(e => e.name).join(', '));

  // Create some additional attendee relationships
  await prisma.event.update({
    where: { id: events[0].id },
    data: {
      attendees: {
        connect: [
          { id: users[3].id },
          { id: users[4].id },
        ],
      },
    },
  });

  await prisma.event.update({
    where: { id: events[5].id },
    data: {
      attendees: {
        connect: [
          { id: users[0].id },
          { id: users[2].id },
          { id: users[4].id },
        ],
      },
    },
  });

  console.log('✅ Updated event attendees');

  // Print summary
  const totalUsers = await prisma.user.count();
  const totalEvents = await prisma.event.count();
  
  console.log('');
  console.log('🎉 Database seeding completed! (Static Token Auth)');
  console.log(`📊 Created ${totalUsers} users and ${totalEvents} events`);
  console.log('');
  console.log('🔑 Static Token Authentication:');
  console.log('   Demo User: demo-token-123 (demo@example.com)');
  console.log('   John: john-token-456 (john@example.com)');
  console.log('   Jane: jane-token-789 (jane@example.com)');
  console.log('   Alice: alice-token-101 (alice@example.com)');
  console.log('   Bob: bob-token-202 (bob@example.com)');
  console.log('');
  console.log('📅 Sample Events:');
  events.forEach((event, index) => {
    console.log(`   ${index + 1}. ${event.name} - ${event.location}`);
  });
  console.log('');
  console.log('💡 Usage: Authorization: Bearer demo-token-123');
  console.log('✅ EXACT SCHEMA COMPLIANCE + STATIC TOKEN AUTH');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 