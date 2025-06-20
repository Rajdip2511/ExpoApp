import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { connectDatabase, checkDatabaseHealth } from './utils/database';
import { authenticateToken, createContext, AuthenticatedRequest } from './middleware/auth';
import { initializeSocket } from './socket/socketHandler';

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
    await connectDatabase();

    // Check database health
    const isDbHealthy = await checkDatabaseHealth();
    if (!isDbHealthy) {
      throw new Error('Database health check failed');
    }

    // Create Express app
    const app = express();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    const io = initializeSocket(httpServer);

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:8081',
      credentials: true,
      optionsSuccessStatus: 200,
    }));

    // Rate limiting
    const limiter = rateLimit({
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
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Authentication middleware
    app.use(authenticateToken);

    // Create Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
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
      playground: NODE_ENV !== 'production',
    });

    // Start Apollo Server
    await server.start();

    // Apply GraphQL middleware
    app.use(
      '/graphql',
      expressMiddleware(server, {
        context: createContext,
      })
    );

    // Health check endpoint
    app.get('/health', async (req, res) => {
      try {
        const dbHealth = await checkDatabaseHealth();
        res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: dbHealth ? 'connected' : 'disconnected',
          environment: NODE_ENV,
        });
      } catch (error) {
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
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      httpServer.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          await server.stop();
          console.log('✅ Apollo Server stopped');
        } catch (error) {
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

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export default startServer; 