import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
/**
 * Initialize Socket.io server with authentication and real-time handlers
 */
export declare const initializeSocket: (httpServer: HTTPServer) => SocketIOServer;
/**
 * Broadcast event update to all users in an event room
 */
export declare const broadcastEventUpdate: (io: SocketIOServer, eventId: string, event: any) => void;
/**
 * Broadcast user join event to all users in an event room
 */
export declare const broadcastUserJoined: (io: SocketIOServer, eventId: string, user: any, attendeeCount: number) => void;
/**
 * Broadcast user leave event to all users in an event room
 */
export declare const broadcastUserLeft: (io: SocketIOServer, eventId: string, userId: string, attendeeCount: number) => void;
/**
 * Get online user count for an event
 */
export declare const getEventOnlineCount: (eventId: string) => number;
/**
 * Get all active event rooms
 */
export declare const getActiveEventRooms: () => Map<string, Set<string>>;
