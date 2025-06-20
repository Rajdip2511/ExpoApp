"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveEventRooms = exports.getEventOnlineCount = exports.broadcastUserLeft = exports.broadcastUserJoined = exports.broadcastEventUpdate = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const auth_1 = require("../utils/auth");
const database_1 = __importDefault(require("../utils/database"));
// Store active connections per event
const eventRooms = new Map();
/**
 * Initialize Socket.io server with authentication and real-time handlers
 */
const initializeSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:8081",
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });
    // Authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token ||
                (0, auth_1.extractTokenFromHeader)(socket.handshake.headers.authorization);
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const decoded = (0, auth_1.verifyToken)(token);
            if (!decoded) {
                return next(new Error('Invalid authentication token'));
            }
            // Fetch user from database
            const user = await database_1.default.user.findUnique({
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
        }
        catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication failed'));
        }
    });
    // Handle socket connections
    io.on('connection', (socket) => {
        console.log(`✅ User ${socket.user?.name} connected via Socket.io`);
        // Handle joining an event room
        socket.on('join-event', async (eventId) => {
            try {
                // Verify event exists
                const event = await database_1.default.event.findUnique({
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
                eventRooms.get(eventId).add(socket.userId);
                console.log(`👥 User ${socket.user?.name} joined event ${event.name} room`);
                // Emit current event state to the joining user
                socket.emit('event-state', {
                    event,
                    attendeeCount: event.attendees.length,
                    isUserAttending: event.attendees.some((attendee) => attendee.id === socket.userId)
                });
                // Notify other users in the room about the join
                socket.to(`event-${eventId}`).emit('user-joined-room', {
                    user: socket.user,
                    eventId,
                    onlineCount: eventRooms.get(eventId).size
                });
            }
            catch (error) {
                console.error('Error joining event:', error);
                socket.emit('error', { message: 'Failed to join event' });
            }
        });
        // Handle leaving an event room
        socket.on('leave-event', (eventId) => {
            try {
                socket.leave(`event-${eventId}`);
                // Remove user from event room tracking
                if (eventRooms.has(eventId)) {
                    eventRooms.get(eventId).delete(socket.userId);
                    if (eventRooms.get(eventId).size === 0) {
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
            }
            catch (error) {
                console.error('Error leaving event:', error);
            }
        });
        // Handle real-time event updates (triggered from GraphQL mutations)
        socket.on('event-updated', (data) => {
            // Broadcast to all users in the event room
            io.to(`event-${data.eventId}`).emit('event-updated', data);
        });
        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User ${socket.user?.name} disconnected from Socket.io`);
            // Remove user from all event rooms
            eventRooms.forEach((users, eventId) => {
                if (users.has(socket.userId)) {
                    users.delete(socket.userId);
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
exports.initializeSocket = initializeSocket;
/**
 * Broadcast event update to all users in an event room
 */
const broadcastEventUpdate = (io, eventId, event) => {
    io.to(`event-${eventId}`).emit('event-updated', {
        eventId,
        event,
        timestamp: new Date().toISOString()
    });
};
exports.broadcastEventUpdate = broadcastEventUpdate;
/**
 * Broadcast user join event to all users in an event room
 */
const broadcastUserJoined = (io, eventId, user, attendeeCount) => {
    io.to(`event-${eventId}`).emit('user-joined-event', {
        eventId,
        user,
        attendeeCount,
        timestamp: new Date().toISOString()
    });
};
exports.broadcastUserJoined = broadcastUserJoined;
/**
 * Broadcast user leave event to all users in an event room
 */
const broadcastUserLeft = (io, eventId, userId, attendeeCount) => {
    io.to(`event-${eventId}`).emit('user-left-event', {
        eventId,
        userId,
        attendeeCount,
        timestamp: new Date().toISOString()
    });
};
exports.broadcastUserLeft = broadcastUserLeft;
/**
 * Get online user count for an event
 */
const getEventOnlineCount = (eventId) => {
    return eventRooms.get(eventId)?.size || 0;
};
exports.getEventOnlineCount = getEventOnlineCount;
/**
 * Get all active event rooms
 */
const getActiveEventRooms = () => {
    return eventRooms;
};
exports.getActiveEventRooms = getActiveEventRooms;
