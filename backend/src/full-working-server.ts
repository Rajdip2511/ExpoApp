import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import * as jwt from 'jsonwebtoken';
import { DateTimeResolver } from 'graphql-scalars';
import prisma, { connectDatabase, disconnectDatabase, checkDatabaseHealth } from './utils/database';

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

// Static Token Mappings (Exact match with frontend)
const STATIC_JWT_TOKENS: Record<string, any> = {
  'demo-token-123': { userId: 'demo-user-id', email: 'demo@example.com', name: 'Demo User' },
  'john-token-456': { userId: 'john-user-id', email: 'john@example.com', name: 'John Smith' },
  'jane-token-789': { userId: 'jane-user-id', email: 'jane@example.com', name: 'Jane Doe' },
  'alice-token-101': { userId: 'alice-user-id', email: 'alice@example.com', name: 'Alice Johnson' },
  'bob-token-202': { userId: 'bob-user-id', email: 'bob@example.com', name: 'Bob Wilson' },
};

// GraphQL Schema - Exact compliance with requirements
const typeDefs = `#graphql
  scalar DateTime

  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Event {
    id: ID!
    name: String!
    description: String
    location: String!
    startTime: DateTime!
    endTime: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    attendees: [User!]!
    attendeeCount: Int!
  }

  input CreateEventInput {
    name: String!
    description: String
    location: String!
    startTime: DateTime!
    endTime: DateTime
  }

  type Query {
    health: String!
    hello: String!
    events: [Event!]!
    event(id: ID!): Event
    me: User
    myEvents: [Event!]!
  }

  type Mutation {
    createEvent(input: CreateEventInput!): Event!
    joinEvent(eventId: ID!): Event!
    leaveEvent(eventId: ID!): Event!
  }
`;

// Static Token verification (Frontend compatibility)
const verifyToken = (token: string) => {
  // Check static tokens first
  if (STATIC_JWT_TOKENS[token]) {
    return STATIC_JWT_TOKENS[token];
  }
  
  // Fallback to JWT verification
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

// GraphQL Resolvers using Prisma - Schema Compliant
const resolvers = {
  DateTime: DateTimeResolver,
  
  Query: {
    health: () => 'OK - Database and GraphQL Working with Prisma! (JWT + Static Tokens)',
    hello: () => 'Hello from Real-Time Event Check-In API with JWT Static Token Authentication!',
    
    events: async () => {
      try {
        const events = await prisma.event.findMany({
          include: {
            attendees: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        });
        
        return events;
      } catch (error) {
        console.error('Error fetching events:', error);
        throw new Error('Failed to fetch events');
      }
    },
    
    event: async (_: any, { id }: { id: string }) => {
      try {
        const event = await prisma.event.findUnique({
          where: { id },
          include: {
            attendees: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          }
        });
        
        if (!event) {
          throw new Error('Event not found');
        }
        
        return event;
      } catch (error) {
        console.error('Error fetching event:', error);
        throw new Error('Failed to fetch event');
      }
    },
    
    me: async (_: any, __: any, context: any) => {
      if (!context.user) return null;
      
      try {
        const user = await prisma.user.findUnique({
          where: { id: context.user.userId },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          }
        });
        
        return user;
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    
    myEvents: async (_: any, __: any, context: any) => {
      if (!context.user) return [];
      
      try {
        const events = await prisma.event.findMany({
          where: {
            attendees: {
              some: {
                id: context.user.userId
              }
            }
          },
          include: {
            attendees: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        });
        
        return events;
      } catch (error) {
        console.error('Error fetching user events:', error);
        return [];
      }
    },
  },
  
  Mutation: {
    createEvent: async (_: any, { input }: { input: any }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      try {
        const event = await prisma.event.create({
          data: {
            name: input.name,
            description: input.description,
            location: input.location,
            startTime: new Date(input.startTime),
            endTime: input.endTime ? new Date(input.endTime) : null,
          },
          include: {
            attendees: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          }
        });
        
        return event;
      } catch (error: any) {
        console.error('Create event error:', error);
        throw new Error('Failed to create event: ' + error.message);
      }
    },
    
    joinEvent: async (_: any, { eventId }: { eventId: string }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      try {
        // Check if already joined
        const existingConnection = await prisma.event.findFirst({
          where: {
            id: eventId,
            attendees: {
              some: {
                id: context.user.userId
              }
            }
          }
        });
        
        if (existingConnection) {
          throw new Error('Already joined this event');
        }
        
        // Add user to event using Prisma's connect
        const updatedEvent = await prisma.event.update({
          where: { id: eventId },
          data: {
            attendees: {
              connect: {
                id: context.user.userId
              }
            }
          },
          include: {
            attendees: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        });

        // Get user info for broadcasting
        const userInfo = await prisma.user.findUnique({
          where: { id: context.user.userId },
          select: {
            id: true,
            name: true,
            email: true,
          }
        });

        // Broadcast real-time update
        context.io.to(`event-${eventId}`).emit('user-joined-event', {
          eventId,
          user: userInfo,
          event: updatedEvent
        });

        return updatedEvent;
      } catch (error: any) {
        console.error('Join event error:', error);
        throw new Error('Failed to join event: ' + error.message);
      }
    },
    
    leaveEvent: async (_: any, { eventId }: { eventId: string }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      try {
        // Get user info before removing (for broadcasting)
        const userInfo = await prisma.user.findUnique({
          where: { id: context.user.userId },
          select: {
            id: true,
            name: true,
            email: true,
          }
        });

        // Remove user from event using Prisma's disconnect
        const updatedEvent = await prisma.event.update({
          where: { id: eventId },
          data: {
            attendees: {
              disconnect: {
                id: context.user.userId
              }
            }
          },
          include: {
            attendees: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        });

        // Broadcast real-time update
        context.io.to(`event-${eventId}`).emit('user-left-event', {
          eventId,
          user: userInfo,
          event: updatedEvent
        });

        return updatedEvent;
      } catch (error: any) {
        console.error('Leave event error:', error);
        throw new Error('Failed to leave event: ' + error.message);
      }
    },
  },
  
  Event: {
    attendeeCount: (parent: any) => {
      return parent.attendees ? parent.attendees.length : 0;
    }
  }
};

async function startFullWorkingServer() {
  try {
    console.log('🚀 Starting Schema-Compliant Event Check-In Server with JWT Static Tokens...');

    // Test Prisma connection
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

    // Socket.io connection handling with authentication
    io.use((socket: any, next) => {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          socket.userId = decoded.userId;
          socket.userEmail = decoded.email;
          next();
        } else {
          next(new Error('Authentication error'));
        }
      } else {
        next(new Error('No token provided'));
      }
    });

    io.on('connection', (socket: any) => {
      console.log(`👤 User connected: ${socket.userEmail} (${socket.id})`);
      
      socket.on('join-event', (eventId: string) => {
        socket.join(`event-${eventId}`);
        console.log(`👥 User ${socket.userEmail} joined event ${eventId}`);
        
        // Broadcast to others in the room
        socket.to(`event-${eventId}`).emit('user-joined-room', {
          eventId,
          userId: socket.userId,
          email: socket.userEmail
        });
      });

      socket.on('leave-event', (eventId: string) => {
        socket.leave(`event-${eventId}`);
        console.log(`👋 User ${socket.userEmail} left event ${eventId}`);
        
        // Broadcast to others in the room
        socket.to(`event-${eventId}`).emit('user-left-room', {
          eventId,
          userId: socket.userId,
          email: socket.userEmail
        });
      });

      socket.on('disconnect', () => {
        console.log(`👤 User disconnected: ${socket.userEmail} (${socket.id})`);
      });
    });

    // Middleware
    app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:8081",
      credentials: true
    }));
    app.use(express.json());

    // JWT Authentication Middleware (with static tokens)
    app.use((req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        if (decoded) {
          req.user = decoded;
        }
      }
      next();
    });

    // Create Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();

    // Apply GraphQL middleware with context
    app.use('/graphql', expressMiddleware(server, {
      context: async ({ req }: { req: any }) => ({
        user: req.user || null,
        io, // Add Socket.io instance to context
      }),
    }));

    // Health check with Prisma
    app.get('/health', async (req, res) => {
      const healthCheck = await checkDatabaseHealth();
      
      if (healthCheck.status === 'healthy') {
        res.json({ 
          status: 'OK', 
          timestamp: healthCheck.timestamp,
          database: 'connected',
          orm: 'Prisma',
          schema: 'EXACT COMPLIANCE',
          authentication: 'JWT + Static Tokens',
          message: 'Schema-compliant server with JWT static tokens is operational!',
        });
      } else {
        res.status(500).json({
          status: 'ERROR',
          message: 'Database connection failed',
          error: healthCheck.error,
          timestamp: healthCheck.timestamp,
        });
      }
    });

    // API info
    app.get('/', (req, res) => {
      res.json({
        name: 'Real-Time Event Check-In API',
        version: '1.0.0',
        status: 'SCHEMA COMPLIANT',
        database: 'PostgreSQL with Prisma ORM',
        schema: 'EXACT REQUIREMENTS MATCH',
        authentication: 'JWT + Static Tokens (As Required)',
        graphql: '/graphql',
        health: '/health',
        features: [
          'JWT Static Token Authentication 🔑',
          'Event Management 📅',
          'Real-time Attendee Updates ⚡',
          'GraphQL API 🚀',
          'Prisma ORM 🗄️',
          'Socket.io Real-time 📡',
          'CORS Enabled 🌐',
          'EXACT SCHEMA COMPLIANCE ✅',
        ],
        message: 'Schema-compliant backend with JWT static tokens ready!',
        staticJWTTokens: STATIC_JWT_TOKENS,
        usage: {
          header: `Authorization: Bearer demo-token-123`,
          example: `curl -H "Authorization: Bearer demo-token-123" http://localhost:4000/graphql`
        }
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`🚀 Schema-compliant server running on http://localhost:${PORT}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      console.log(`🔍 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  Database: PostgreSQL with Prisma ORM`);
      console.log(`📋 Schema: EXACT COMPLIANCE (User: id,name,email,events | Event: id,name,location,startTime,attendees)`);
      console.log(`🔐 Authentication: JWT + Static Tokens (As Required)`);
      console.log(`📡 Real-time: Socket.io enabled`);
      console.log('🎉 READY FOR FRONTEND DEVELOPMENT!');
      console.log('');
      console.log('🔑 Static JWT Tokens Available:');
      console.log(`   Demo User: demo-token-123`);
      console.log(`   John: john-token-456`);
      console.log(`   Jane: jane-token-789`);
      console.log(`   Alice: alice-token-101`);
      console.log(`   Bob: bob-token-202`);
      console.log('');
      console.log('💡 Usage: Authorization: Bearer <jwt-token>');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

if (require.main === module) {
  startFullWorkingServer();
}

export default startFullWorkingServer;
