"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const typeDefs_1 = require("./schema/typeDefs");
const resolvers_1 = require("./schema/resolvers");
const database_1 = require("./utils/database");
const auth_1 = require("./middleware/auth");
const socketHandler_1 = require("./socket/socketHandler");
const full_working_server_1 = __importDefault(require("./full-working-server"));
// Configuration
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
/**
 * Main function to start the server
 */
async function startServer() {
    try {
        console.log('🚀 Starting Real-Time Event Check-In Server...');
        // Connect to database
        await (0, database_1.connectDatabase)();
        // Check database health
        const isDbHealthy = await (0, database_1.checkDatabaseHealth)();
        if (!isDbHealthy) {
            throw new Error('Database health check failed');
        }
        // Create Express app
        const app = (0, express_1.default)();
        // Create HTTP server
        const httpServer = (0, http_1.createServer)(app);
        // Initialize Socket.io
        const io = (0, socketHandler_1.initializeSocket)(httpServer);
        // Security middleware
        app.use((0, helmet_1.default)({
            contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
            crossOriginEmbedderPolicy: false,
        }));
        // CORS configuration
        app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || 'http://localhost:8081',
            credentials: true,
            optionsSuccessStatus: 200,
        }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.',
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        app.use('/graphql', limiter);
        // Body parsing middleware
        app.use(express_1.default.json({ limit: '10mb' }));
        app.use(express_1.default.urlencoded({ extended: true }));
        // Authentication middleware
        app.use(auth_1.authenticateToken);
        // Create Apollo Server
        const server = new server_1.ApolloServer({
            typeDefs: typeDefs_1.typeDefs,
            resolvers: resolvers_1.resolvers,
            plugins: [
                (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
            ],
            formatError: (error) => {
                console.error('GraphQL Error:', error);
                if (NODE_ENV === 'production') {
                    // Don't expose internal errors in production
                    if (error.message.startsWith('Context creation failed') ||
                        error.message.includes('prisma')) {
                        return new Error('Internal server error');
                    }
                }
                return error;
            },
            introspection: NODE_ENV !== 'production',
        });
        // Start Apollo Server
        await server.start();
        // Apply GraphQL middleware
        app.use('/graphql', (0, express4_1.expressMiddleware)(server, {
            context: (0, auth_1.createContext)(io),
        }));
        // Health check endpoint
        app.get('/health', async (req, res) => {
            try {
                const dbHealth = await (0, database_1.checkDatabaseHealth)();
                res.json({
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    database: dbHealth ? 'connected' : 'disconnected',
                    environment: NODE_ENV,
                });
            }
            catch (error) {
                res.status(500).json({
                    status: 'ERROR',
                    error: 'Health check failed',
                });
            }
        });
        // API info endpoint
        app.get('/', (req, res) => {
            res.json({
                name: 'Real-Time Event Check-In API',
                version: '1.0.0',
                graphql: '/graphql',
                health: '/health',
                environment: NODE_ENV,
                socketio: 'Connected',
            });
        });
        // 404 handler
        app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                message: 'The requested resource does not exist',
            });
        });
        // Global error handler
        app.use((error, req, res, next) => {
            console.error('Unhandled error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: NODE_ENV === 'production' ? 'Something went wrong' : error.message,
            });
        });
        // Start HTTP server
        httpServer.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`🚀 GraphQL endpoint: http://localhost:${PORT}/graphql`);
            console.log(`🔌 Socket.io ready for real-time connections`);
            console.log(`💊 Health check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${NODE_ENV}`);
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
            httpServer.close(async () => {
                console.log('✅ HTTP server closed');
                try {
                    await server.stop();
                    console.log('✅ Apollo Server stopped');
                }
                catch (error) {
                    console.error('❌ Error stopping Apollo Server:', error);
                }
                process.exit(0);
            });
        };
        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            process.exit(1);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Start the full working server with Prisma
(0, full_working_server_1.default)().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
exports.default = startServer;
