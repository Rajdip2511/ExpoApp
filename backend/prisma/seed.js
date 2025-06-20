"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const auth_1 = require("../src/utils/auth");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    // Create sample users
    console.log('👥 Creating sample users...');
    const users = await Promise.all([
        prisma.user.create({
            data: {
                name: 'John Doe',
                email: 'john@example.com',
                password: await (0, auth_1.hashPassword)('password123'),
                avatar: (0, auth_1.generateAvatarUrl)('John Doe'),
            },
        }),
        prisma.user.create({
            data: {
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: await (0, auth_1.hashPassword)('password123'),
                avatar: (0, auth_1.generateAvatarUrl)('Jane Smith'),
            },
        }),
        prisma.user.create({
            data: {
                name: 'Alice Johnson',
                email: 'alice@example.com',
                password: await (0, auth_1.hashPassword)('password123'),
                avatar: (0, auth_1.generateAvatarUrl)('Alice Johnson'),
            },
        }),
        prisma.user.create({
            data: {
                name: 'Bob Wilson',
                email: 'bob@example.com',
                password: await (0, auth_1.hashPassword)('password123'),
                avatar: (0, auth_1.generateAvatarUrl)('Bob Wilson'),
            },
        }),
        prisma.user.create({
            data: {
                name: 'Demo User',
                email: 'demo@example.com',
                password: await (0, auth_1.hashPassword)('password123'),
                avatar: (0, auth_1.generateAvatarUrl)('Demo User'),
            },
        }),
    ]);
    console.log(`✅ Created ${users.length} users`);
    // Create sample events
    console.log('🎉 Creating sample events...');
    const events = await Promise.all([
        prisma.event.create({
            data: {
                name: 'Tech Conference 2025',
                description: 'Annual technology conference featuring the latest innovations in software development, AI, and cybersecurity.',
                location: 'San Francisco Convention Center',
                startTime: new Date('2025-03-15T09:00:00Z'),
                endTime: new Date('2025-03-15T18:00:00Z'),
                attendees: {
                    connect: [
                        { id: users[0].id },
                        { id: users[1].id },
                        { id: users[4].id },
                    ],
                },
            },
        }),
        prisma.event.create({
            data: {
                name: 'College Music Festival',
                description: 'A vibrant music festival featuring local bands and student performances.',
                location: 'University Campus Amphitheater',
                startTime: new Date('2025-04-20T14:00:00Z'),
                endTime: new Date('2025-04-20T23:00:00Z'),
                attendees: {
                    connect: [
                        { id: users[1].id },
                        { id: users[2].id },
                        { id: users[3].id },
                    ],
                },
            },
        }),
        prisma.event.create({
            data: {
                name: 'Open Mic Night',
                description: 'Monthly open mic event for aspiring comedians, poets, and musicians.',
                location: 'Downtown Coffee House',
                startTime: new Date('2025-02-28T19:00:00Z'),
                endTime: new Date('2025-02-28T22:00:00Z'),
                attendees: {
                    connect: [
                        { id: users[0].id },
                        { id: users[2].id },
                    ],
                },
            },
        }),
        prisma.event.create({
            data: {
                name: 'Startup Pitch Competition',
                description: 'Entrepreneurs present their innovative ideas to a panel of investors.',
                location: 'Business Innovation Hub',
                startTime: new Date('2025-05-10T10:00:00Z'),
                endTime: new Date('2025-05-10T16:00:00Z'),
                attendees: {
                    connect: [
                        { id: users[3].id },
                        { id: users[4].id },
                    ],
                },
            },
        }),
        prisma.event.create({
            data: {
                name: 'Community Food Festival',
                description: 'Celebrate local cuisine with food trucks, cooking demonstrations, and live entertainment.',
                location: 'Central Park',
                startTime: new Date('2025-06-15T11:00:00Z'),
                endTime: new Date('2025-06-15T20:00:00Z'),
                attendees: {
                    connect: [
                        { id: users[0].id },
                        { id: users[1].id },
                        { id: users[2].id },
                        { id: users[3].id },
                    ],
                },
            },
        }),
        prisma.event.create({
            data: {
                name: 'AI & Machine Learning Workshop',
                description: 'Hands-on workshop covering the fundamentals of AI and machine learning.',
                location: 'Tech University Lab Building',
                startTime: new Date('2025-07-22T09:00:00Z'),
                endTime: new Date('2025-07-22T17:00:00Z'),
                attendees: {
                    connect: [
                        { id: users[4].id },
                    ],
                },
            },
        }),
    ]);
    console.log(`✅ Created ${events.length} events`);
    // Log summary
    console.log('\n📊 Seeding Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`🎉 Events: ${events.length}`);
    console.log('\n🔐 Sample Login Credentials:');
    console.log('Email: demo@example.com');
    console.log('Password: password123');
    console.log('\n📧 All users have the same password: password123');
    console.log('Available emails:');
    users.forEach(user => {
        console.log(`  - ${user.email}`);
    });
    console.log('\n✅ Database seeding completed!');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
});
