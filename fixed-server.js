// Fixed Backend Server with Proper Authentication
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const cors = require('cors');
const { getAuthenticatedUser } = require('./auth-fix');

// Import existing modules
const typeDefs = require('./dist/schema/typeDefs').typeDefs;
const resolvers = require('./dist/schema/resolvers').resolvers;
const { connectDatabase, checkDatabaseHealth } = require('./dist/utils/database');

const PORT = process.env.PORT || 4000;

async function startFixedServer() {
  try {
    console.log('🚀 Starting FIXED Backend Server...');

    // Test database connection
    const connected = await connectDatabase();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Create Express app
    const app = express();
    const httpServer = createServer(app);

    // Setup Socket.io
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:8081",
        methods: ["GET", "POST"]
      }
    });

    // Socket.io authentication and connection handling
    io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      if (token) {
        const user = await getAuthenticatedUser({ headers: { authorization: `Bearer ${token}` } });
        if (user) {
          socket.userId = user.id;
          socket.userEmail = user.email;
          socket.userName = user.name;
          next();
        } else {
          next(new Error('Authentication error'));
        }
      } else {
        next(new Error('No token provided'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`👤 User connected: ${socket.userName} (${socket.userEmail})`);
      
      socket.on('join-event', (eventId) => {
        socket.join(`event-${eventId}`);
        console.log(`👥 User ${socket.userName} joined event ${eventId}`);
        
        socket.to(`event-${eventId}`).emit('user-joined-room', {
          eventId,
          userId: socket.userId,
          email: socket.userEmail,
          name: socket.userName
        });
      });

      socket.on('leave-event', (eventId) => {
        socket.leave(`event-${eventId}`);
        console.log(`👋 User ${socket.userName} left event ${eventId}`);
        
        socket.to(`event-${eventId}`).emit('user-left-room', {
          eventId,
          userId: socket.userId,
          email: socket.userEmail,
          name: socket.userName
        });
      });

      socket.on('disconnect', () => {
        console.log(`👤 User disconnected: ${socket.userName}`);
      });
    });

    // Middleware
    app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:8081",
      credentials: true
    }));
    app.use(express.json());

    // Create Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();

    // Apply GraphQL middleware with FIXED context
    app.use('/graphql', expressMiddleware(server, {
      context: async ({ req }) => {
        const user = await getAuthenticatedUser(req);
        return {
          user, // Now this will be the full user object with id, name, email, etc.
          req,
          io, // Socket.io instance for real-time updates
        };
      },
    }));

    // Health check
    app.get('/health', async (req, res) => {
      const healthCheck = await checkDatabaseHealth();
      
      if (healthCheck.status === 'healthy') {
        res.json({ 
          status: 'OK - AUTHENTICATION FIXED', 
          timestamp: healthCheck.timestamp,
          database: 'connected',
          message: 'Fixed backend with proper GraphQL authentication!',
        });
      } else {
        res.status(500).json({
          status: 'ERROR',
          message: 'Database connection failed',
          error: healthCheck.error,
        });
      }
    });

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🎉 FIXED Backend running on http://localhost:${PORT}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      console.log(`🔍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Authentication: FIXED - mutations will work!`);
      console.log(`📡 Socket.io: Real-time updates enabled`);
      console.log('');
      console.log('🔑 Demo Tokens:');
      console.log('   demo-token-123, john-token-456, jane-token-789');
      console.log('   alice-token-101, bob-token-202');
    });

  } catch (error) {
    console.error('❌ Failed to start fixed server:', error);
    process.exit(1);
  }
}

// Start the fixed server
startFixedServer(); 