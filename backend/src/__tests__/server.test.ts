import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { Server as SocketIOServer } from 'socket.io';
import { io } from 'socket.io-client';
import { typeDefs } from '../schema/typeDefs';
import { resolvers } from '../schema/resolvers';
import { authenticateToken, createContext } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { generateToken, hashPassword } from '../utils/auth';
import cors from 'cors';

// Test database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:9836280158@localhost:5432/event_checkin_db?schema=public';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

// Test server setup
let app: express.Application;
let httpServer: any;
let apollo: ApolloServer;
let io: SocketIOServer;
let clientSocket: any;

// Test data
let testUser: any;
let secondTestUser: any;
let testEvent: any;
let authToken: string;
let secondAuthToken: string;

// Static tokens for testing
const DEMO_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZW1vLXVzZXItaWQiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJpYXQiOjE3NTA1OTE0MzUsImV4cCI6NDkwNjM1MTQzNX0.uQxnMkPLzVpRvP_D2kdqKXWzHEhbF9VrmMdx1JJ5YKI";

beforeAll(async () => {
  // Set up test server
  app = express();
  httpServer = createServer(app);

  // Initialize Socket.io
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(authenticateToken);

  // Apollo Server
  apollo = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apollo.start();

  // Apply GraphQL middleware with Socket.io context
  app.use('/graphql', expressMiddleware(apollo, {
    context: createContext(io),
  }));

  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Start server
  httpServer.listen(4001, () => {
    console.log('Test server running on port 4001');
  });
});

beforeEach(async () => {
  try {
    // Find demo user from seeded data
    testUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: 'Demo User',
          email: 'demo@example.com',
          password: await hashPassword('password123'),
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser',
        },
      });
    }

    // Find second user
    secondTestUser = await prisma.user.findUnique({
      where: { email: 'john@example.com' }
    });

    if (!secondTestUser) {
      secondTestUser = await prisma.user.create({
        data: {
          name: 'John Smith',
          email: 'john@example.com',
          password: await hashPassword('password123'),
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JohnSmith',
        },
      });
    }

    // Generate auth tokens
    authToken = generateToken(testUser);
    secondAuthToken = generateToken(secondTestUser);

    // Find or create test event
    testEvent = await prisma.event.findFirst({
      where: { name: 'Test Event Integration' }
    });

    if (!testEvent) {
      testEvent = await prisma.event.create({
        data: {
          name: 'Test Event Integration',
          description: 'A comprehensive test event',
          location: 'Test Location Hub',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
        },
      });
    }

    // Setup Socket.io client for testing
    clientSocket = SocketIOClient('http://localhost:4001', {
      auth: {
        token: authToken
      }
    });

    // Wait for connection
    await new Promise((resolve) => {
      clientSocket.on('connect', resolve);
    });

  } catch (error) {
    console.error('Test setup error:', error);
  }
});

afterEach(async () => {
  if (clientSocket) {
    clientSocket.disconnect();
  }
});

afterAll(async () => {
  if (apollo) {
    await apollo.stop();
  }
  if (httpServer) {
    httpServer.close();
  }
  await prisma.$disconnect();
});

describe('Health Check', () => {
  test('should return OK status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
  });
});

describe('Authentication', () => {
  test('should register a new user', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user {
            id
            name
            email
          }
        }
      }
    `;

    const variables = {
      input: {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.data.register).toBeDefined();
    expect(response.body.data.register.token).toBeDefined();
    expect(response.body.data.register.user.email).toBe('newuser@example.com');
  });

  test('should login with correct credentials', async () => {
    const mutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          user {
            id
            name
            email
          }
        }
      }
    `;

    const variables = {
      input: {
        email: 'test@example.com',
        password: 'password123',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.data.login).toBeDefined();
    expect(response.body.data.login.token).toBeDefined();
    expect(response.body.data.login.user.email).toBe('test@example.com');
  });

  test('should fail login with incorrect credentials', async () => {
    const mutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          user {
            id
            name
            email
          }
        }
      }
    `;

    const variables = {
      input: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].extensions.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('Events', () => {
  test('should fetch all events', async () => {
    const query = `
      query {
        events {
          id
          name
          location
          attendeeCount
        }
      }
    `;

    const response = await request(app)
      .post('/graphql')
      .send({ query })
      .expect(200);

    expect(response.body.data.events).toBeDefined();
    expect(Array.isArray(response.body.data.events)).toBe(true);
    expect(response.body.data.events.length).toBeGreaterThan(0);
  });

  test('should fetch single event by ID', async () => {
    const query = `
      query GetEvent($id: ID!) {
        event(id: $id) {
          id
          name
          location
          description
          attendeeCount
        }
      }
    `;

    const variables = { id: testEvent.id };

    const response = await request(app)
      .post('/graphql')
      .send({ query, variables })
      .expect(200);

    expect(response.body.data.event).toBeDefined();
    expect(response.body.data.event.id).toBe(testEvent.id);
    expect(response.body.data.event.name).toBe('Test Event');
  });

  test('should create a new event (authenticated)', async () => {
    const mutation = `
      mutation CreateEvent($input: CreateEventInput!) {
        createEvent(input: $input) {
          id
          name
          location
          description
        }
      }
    `;

    const variables = {
      input: {
        name: 'New Test Event',
        description: 'A new test event',
        location: 'New Test Location',
        startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      },
    };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.data.createEvent).toBeDefined();
    expect(response.body.data.createEvent.name).toBe('New Test Event');
  });

  test('should fail to create event without authentication', async () => {
    const mutation = `
      mutation CreateEvent($input: CreateEventInput!) {
        createEvent(input: $input) {
          id
          name
          location
        }
      }
    `;

    const variables = {
      input: {
        name: 'Unauthorized Event',
        location: 'Unauthorized Location',
        startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });
});

describe('Event Participation', () => {
  test('should join an event', async () => {
    const mutation = `
      mutation JoinEvent($eventId: ID!) {
        joinEvent(eventId: $eventId) {
          id
          attendeeCount
          attendees {
            id
            name
          }
        }
      }
    `;

    const variables = { eventId: testEvent.id };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.data.joinEvent).toBeDefined();
    expect(response.body.data.joinEvent.attendeeCount).toBe(1);
    expect(response.body.data.joinEvent.attendees[0].id).toBe(testUser.id);
  });

  test('should leave an event', async () => {
    // First join the event
    await prisma.event.update({
      where: { id: testEvent.id },
      data: {
        attendees: {
          connect: { id: testUser.id },
        },
      },
    });

    const mutation = `
      mutation LeaveEvent($eventId: ID!) {
        leaveEvent(eventId: $eventId) {
          id
          attendeeCount
          attendees {
            id
          }
        }
      }
    `;

    const variables = { eventId: testEvent.id };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.data.leaveEvent).toBeDefined();
    expect(response.body.data.leaveEvent.attendeeCount).toBe(0);
  });

  test('should fail to join non-existent event', async () => {
    const mutation = `
      mutation JoinEvent($eventId: ID!) {
        joinEvent(eventId: $eventId) {
          id
          attendeeCount
        }
      }
    `;

    const variables = { eventId: 'non-existent-id' };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].extensions.code).toBe('NOT_FOUND');
  });
});

describe('User Queries', () => {
  test('should get current user (me query)', async () => {
    const query = `
      query {
        me {
          id
          name
          email
        }
      }
    `;

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query })
      .expect(200);

    expect(response.body.data.me).toBeDefined();
    expect(response.body.data.me.email).toBe('test@example.com');
  });

  test('should get user events', async () => {
    // Join an event first
    await prisma.event.update({
      where: { id: testEvent.id },
      data: {
        attendees: {
          connect: { id: testUser.id },
        },
      },
    });

    const query = `
      query {
        myEvents {
          id
          name
          attendeeCount
        }
      }
    `;

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query })
      .expect(200);

    expect(response.body.data.myEvents).toBeDefined();
    expect(Array.isArray(response.body.data.myEvents)).toBe(true);
    expect(response.body.data.myEvents.length).toBe(1);
  });
});

describe('Input Validation', () => {
  test('should validate email format on registration', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user {
            email
          }
        }
      }
    `;

    const variables = {
      input: {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].extensions.code).toBe('INVALID_INPUT');
  });

  test('should validate password length', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user {
            email
          }
        }
      }
    `;

    const variables = {
      input: {
        name: 'Test User',
        email: 'test2@example.com',
        password: '123', // Too short
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].extensions.code).toBe('INVALID_INPUT');
  });

  test('should validate event start time is in future', async () => {
    const mutation = `
      mutation CreateEvent($input: CreateEventInput!) {
        createEvent(input: $input) {
          id
          name
        }
      }
    `;

    const variables = {
      input: {
        name: 'Past Event',
        location: 'Past Location',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      },
    };

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: mutation, variables })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].extensions.code).toBe('INVALID_INPUT');
  });
}); 