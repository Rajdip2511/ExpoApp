import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client
declare global {
  var __prisma: PrismaClient | undefined;
}

// Singleton pattern for Prisma Client to prevent multiple instances
const prisma = globalThis.__prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Connect to database
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to database successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    return false;
  }
}

// Disconnect from database
async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected from database successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
  }
}

// Health check for database
async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
}

export default prisma;
export { connectDatabase, disconnectDatabase, checkDatabaseHealth }; 