# Real-Time Event Check-In App

A full-stack real-time event engagement platform built with React Native Expo (frontend) and Node.js + GraphQL (backend). Users can browse upcoming events and check in to them with instant real-time updates showing attendee lists.

## 🎯 Features

- **Real-time Updates**: Instant attendee updates via Socket.io when users join/leave events
- **GraphQL API**: Type-safe API with queries, mutations, and subscriptions
- **Authentication**: JWT-based authentication with secure password hashing
- **Event Management**: Create, browse, and join events
- **Live Attendee Lists**: See who's attending events in real-time
- **Mobile-First**: React Native Expo app with native mobile experience
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Scalable Architecture**: Ready for horizontal scaling with Redis

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Language** | TypeScript |
| **Backend** | Node.js, Express, Apollo Server (GraphQL) |
| **Database** | PostgreSQL with Prisma ORM |
| **Real-time** | Socket.io |
| **Frontend** | React Native (Expo) |
| **State Management** | Zustand, TanStack Query |
| **Authentication** | JWT |
| **Caching** | Redis |
| **Testing** | Jest, Supertest |

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for databases)
- PostgreSQL (or use Docker setup)
- Redis (optional, for scaling)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/Rajdip2511/FulstackMobileApp.git
cd FulstackMobileApp
```

### 2. Start Database Services

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Or start all services including pgAdmin
docker-compose up -d
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp env.example .env

# Update .env with your database URL:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/event_checkin_db"

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:push

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

The backend will be running at `http://localhost:4000`

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start Expo development server
npm start
```

## 🔧 Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/event_checkin_db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=4000
NODE_ENV="development"

# Redis Configuration (for Socket.io scaling)
REDIS_URL="redis://localhost:6379"

# CORS Configuration
FRONTEND_URL="http://localhost:8081"

# Demo Users (for testing)
DEMO_USER_EMAIL="demo@example.com"
DEMO_USER_PASSWORD="password123"
```

## 🗄️ Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  events    Event[]  @relation("UserEvents")
}

model Event {
  id          String   @id @default(cuid())
  name        String
  description String?
  location    String
  startTime   DateTime
  endTime     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  attendees   User[]   @relation("UserEvents")
}
```

## 🔌 API Endpoints

### GraphQL Endpoint
- **URL**: `http://localhost:4000/graphql`
- **Playground**: Available in development mode

### REST Endpoints
- **Health Check**: `GET /health`
- **API Info**: `GET /`

### Socket.io Events
- **Connection**: `http://localhost:4000`
- **Events**: `join-event`, `leave-event`, `user-joined-event`, `user-left-event`

## 📊 Sample Data

After running the seed command, you can use these credentials:

**Default Login Credentials:**
- Email: `demo@example.com`
- Password: `password123`

**Other Test Users:**
- `john@example.com`
- `jane@example.com`
- `alice@example.com`
- `bob@example.com`

All users have the password: `password123`

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Database Setup

```bash
# Start test database
docker-compose up -d postgres-test

# Set test database URL
export TEST_DATABASE_URL="postgresql://test:test@localhost:5433/event_checkin_test"

# Run tests
npm test
```

## 📱 Frontend Development

```bash
cd frontend

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## 🔒 Authentication Flow

1. **Registration**: Create account with email/password
2. **Login**: Authenticate and receive JWT token
3. **Protected Routes**: Include JWT in Authorization header
4. **Socket.io**: Pass JWT for real-time authentication

**GraphQL Authentication Header:**
```
Authorization: Bearer <your-jwt-token>
```

## 📋 GraphQL Operations

### Queries

```graphql
# Get all events
query {
  events {
    id
    name
    location
    startTime
    attendeeCount
    attendees {
      id
      name
      avatar
    }
  }
}

# Get current user
query {
  me {
    id
    name
    email
    events {
      id
      name
    }
  }
}
```

### Mutations

```graphql
# Register
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

# Join Event
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
```

## 🌐 Production Deployment

### Backend Deployment

1. **Environment Setup**:
   ```env
   NODE_ENV=production
   DATABASE_URL=<production-postgres-url>
   REDIS_URL=<production-redis-url>
   JWT_SECRET=<strong-production-secret>
   ```

2. **Build and Start**:
   ```bash
   npm run build
   npm start
   ```

3. **Database Migration**:
   ```bash
   npm run db:migrate
   ```

### Scaling Considerations

- **Load Balancing**: Use Redis adapter for Socket.io
- **Database**: Connection pooling configured via Prisma
- **Caching**: Redis for session management
- **Rate Limiting**: Built-in rate limiting for API endpoints

## 🐳 Docker Support

### Full Stack Docker Setup

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Included

- **PostgreSQL**: Main database (port 5432)
- **PostgreSQL Test**: Test database (port 5433)
- **Redis**: Caching and Socket.io scaling (port 6379)
- **pgAdmin**: Database management UI (port 8080)

## 🛠️ Development Commands

### Backend Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push     # Push schema to database
npm run db:migrate  # Run migrations
npm run db:studio   # Open Prisma Studio
npm run db:seed     # Seed database

# Testing
npm test           # Run tests
npm run test:watch # Run tests in watch mode
```

### Frontend Commands

```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS
npm run android    # Run on Android
npm run web        # Run on web
npm run build      # Build for production
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Rajdip
- **GitHub**: [@Rajdip2511](https://github.com/Rajdip2511)

## 🙏 Acknowledgments

- Apollo Server for GraphQL implementation
- Prisma for database ORM
- Socket.io for real-time functionality
- Expo for React Native development
- Docker for containerization

---

**🚀 Happy Coding!** If you have any questions or need help, please open an issue on GitHub. 