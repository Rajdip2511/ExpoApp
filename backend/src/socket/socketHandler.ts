import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken, extractTokenFromHeader } from '../utils/auth';
import prisma from '../utils/database';
import { SocketEvents } from '../types';

// Interface for authenticated socket
interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

// Store active connections per event
const eventRooms = new Map<string, Set<string>>();

/**
 * Initialize Socket.io server with authentication and real-time handlers
 */
export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:8081",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   extractTokenFromHeader(socket.handshake.headers.authorization as string);

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid authentication token'));
      }

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ User ${socket.user?.name} connected via Socket.io`);

    // Handle joining an event room
    socket.on('join-event', async (eventId: string) => {
      try {
        // Verify event exists
        const event = await prisma.event.findUnique({
          where: { id: eventId },
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
          socket.emit('error', { message: 'Event not found' });
          return;
        }

        // Join the socket room for this event
        socket.join(`event-${eventId}`);

        // Track user in event room
        if (!eventRooms.has(eventId)) {
          eventRooms.set(eventId, new Set());
        }
        eventRooms.get(eventId)!.add(socket.userId!);

        console.log(`👥 User ${socket.user?.name} joined event ${event.name} room`);

                 // Emit current event state to the joining user
         socket.emit('event-state', {
           event,
           attendeeCount: event.attendees.length,
           isUserAttending: event.attendees.some((attendee: any) => attendee.id === socket.userId)
         });

        // Notify other users in the room about the join
        socket.to(`event-${eventId}`).emit('user-joined-room', {
          user: socket.user,
          eventId,
          onlineCount: eventRooms.get(eventId)!.size
        });

      } catch (error) {
        console.error('Error joining event:', error);
        socket.emit('error', { message: 'Failed to join event' });
      }
    });

    // Handle leaving an event room
    socket.on('leave-event', (eventId: string) => {
      try {
        socket.leave(`event-${eventId}`);

        // Remove user from event room tracking
        if (eventRooms.has(eventId)) {
          eventRooms.get(eventId)!.delete(socket.userId!);
          if (eventRooms.get(eventId)!.size === 0) {
            eventRooms.delete(eventId);
          }
        }

        console.log(`👋 User ${socket.user?.name} left event room`);

        // Notify other users in the room about the leave
        socket.to(`event-${eventId}`).emit('user-left-room', {
          userId: socket.userId,
          eventId,
          onlineCount: eventRooms.get(eventId)?.size || 0
        });

      } catch (error) {
        console.error('Error leaving event:', error);
      }
    });

    // Handle real-time event updates (triggered from GraphQL mutations)
    socket.on('event-updated', (data: { eventId: string; event: any }) => {
      // Broadcast to all users in the event room
      io.to(`event-${data.eventId}`).emit('event-updated', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.user?.name} disconnected from Socket.io`);

      // Remove user from all event rooms
      eventRooms.forEach((users, eventId) => {
        if (users.has(socket.userId!)) {
          users.delete(socket.userId!);
          
          // Notify remaining users in the room
          socket.to(`event-${eventId}`).emit('user-left-room', {
            userId: socket.userId,
            eventId,
            onlineCount: users.size
          });

          // Clean up empty rooms
          if (users.size === 0) {
            eventRooms.delete(eventId);
          }
        }
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

/**
 * Broadcast event update to all users in an event room
 */
export const broadcastEventUpdate = (io: SocketIOServer, eventId: string, event: any) => {
  io.to(`event-${eventId}`).emit('event-updated', {
    eventId,
    event,
    timestamp: new Date().toISOString()
  });
};

/**
 * Broadcast user join event to all users in an event room
 */
export const broadcastUserJoined = (io: SocketIOServer, eventId: string, user: any, attendeeCount: number) => {
  io.to(`event-${eventId}`).emit('user-joined-event', {
    eventId,
    user,
    attendeeCount,
    timestamp: new Date().toISOString()
  });
};

/**
 * Broadcast user leave event to all users in an event room
 */
export const broadcastUserLeft = (io: SocketIOServer, eventId: string, userId: string, attendeeCount: number) => {
  io.to(`event-${eventId}`).emit('user-left-event', {
    eventId,
    userId,
    attendeeCount,
    timestamp: new Date().toISOString()
  });
};

/**
 * Get online user count for an event
 */
export const getEventOnlineCount = (eventId: string): number => {
  return eventRooms.get(eventId)?.size || 0;
};

/**
 * Get all active event rooms
 */
export const getActiveEventRooms = (): Map<string, Set<string>> => {
  return eventRooms;
}; 