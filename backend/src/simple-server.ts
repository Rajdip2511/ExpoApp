import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { connectDatabase } from './utils/database';
import { initializeSocket } from './socket/socketHandler';

const PORT = process.env.PORT || 4000;

async function startSimpleServer() {
  try {
    console.log('🚀 Starting Real-Time Event Check-In Server...');

    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = express();
    const httpServer = createServer(app);

    // Initialize Socket.io
    const io = initializeSocket(httpServer);

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Create Apollo Server with minimal config
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();

    // Apply GraphQL middleware
    app.use(
      '/graphql',
      expressMiddleware(server)
    );

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // API info
    app.get('/', (req, res) => {
      res.json({
        name: 'Real-Time Event Check-In API',
        version: '1.0.0',
        graphql: '/graphql',
        health: '/health',
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🚀 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      console.log(`🔌 Socket.io ready for real-time connections`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startSimpleServer();
}

export default startSimpleServer; 