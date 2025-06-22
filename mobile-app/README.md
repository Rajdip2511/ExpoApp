# Real-Time Event Check-In Mobile App

A React Native Expo app built with TypeScript for real-time event management and check-ins.

## 🚀 Features

- **Authentication**: Login/Register with JWT tokens
- **Event Management**: View, create, join, and leave events
- **Real-time Updates**: Live attendee updates via WebSocket
- **Modern UI**: Beautiful Material Design with React Native Paper
- **State Management**: Zustand for client state, Apollo Client for server state
- **Offline Support**: Caching with Apollo Client and AsyncStorage

## 🛠 Tech Stack

- **React Native**: Expo 53+
- **TypeScript**: Full type safety
- **GraphQL**: Apollo Client for API communication
- **State Management**: Zustand + TanStack Query
- **UI Library**: React Native Paper (Material Design)
- **Storage**: AsyncStorage for local data
- **Real-time**: Socket.io for live updates

## 📦 Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

## 🏗 Project Structure

```
src/
├── config/
│   └── apollo.ts          # Apollo Client configuration
├── stores/
│   └── authStore.ts       # Authentication state management
├── graphql/
│   └── queries.ts         # GraphQL queries and mutations
├── components/
│   ├── auth/
│   │   └── LoginScreen.tsx    # Login screen
│   └── events/
│       └── EventsScreen.tsx   # Events listing screen
└── types/                 # TypeScript type definitions
```

## 🔧 Configuration

### Backend Connection

Update the GraphQL endpoint in `src/config/apollo.ts`:

```typescript
const httpLink = createHttpLink({
  uri: 'http://your-backend-url:4000/graphql',
});
```

### Environment Variables

The app connects to the backend at `http://localhost:4000/graphql` by default.

## 📱 Screens

### Login Screen
- Email/password authentication
- JWT token management
- Automatic session persistence

### Events Screen
- List all available events
- Join/leave events with real-time updates
- Pull-to-refresh functionality
- Create new events (FAB button)

## 🔄 Real-time Features

The app includes Socket.io integration for:
- Live attendee count updates
- Real-time event status changes
- Instant notifications for event updates

## 🧪 Development

```bash
# Start with specific platform
npm run android   # Android
npm run ios       # iOS
npm run web       # Web

# Type checking
npx tsc --noEmit
```

## 🔐 Authentication

The app uses JWT tokens stored in AsyncStorage:
- Automatic token refresh
- Secure storage practices
- Session persistence across app restarts

## 📊 State Management

- **Zustand**: Client-side state (auth, UI state)
- **Apollo Client**: Server state with caching
- **AsyncStorage**: Persistent local storage

## 🎨 UI/UX

- Material Design principles
- Responsive layouts
- Loading states and error handling
- Pull-to-refresh patterns
- FAB for primary actions 