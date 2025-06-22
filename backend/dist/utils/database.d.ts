import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
declare function connectDatabase(): Promise<boolean>;
declare function disconnectDatabase(): Promise<void>;
declare function checkDatabaseHealth(): Promise<{
    status: string;
    timestamp: string;
    error?: undefined;
} | {
    status: string;
    error: any;
    timestamp: string;
}>;
export default prisma;
export { connectDatabase, disconnectDatabase, checkDatabaseHealth };
