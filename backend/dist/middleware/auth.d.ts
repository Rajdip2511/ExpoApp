import { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { Context } from '../types';
export interface AuthenticatedRequest extends Request {
    user?: any;
}
/**
 * Middleware to extract and verify JWT token from request headers
 */
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create GraphQL context with authenticated user and Socket.io server
 */
export declare const createContext: (io?: SocketIOServer) => ({ req, res }: {
    req: AuthenticatedRequest;
    res: Response;
}) => Promise<Context>;
/**
 * Middleware to require authentication
 */
export declare const requireAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Rate limiting middleware for authentication endpoints
 */
export declare const authRateLimit: {
    windowMs: number;
    max: number;
    message: {
        success: boolean;
        error: string;
        message: string;
    };
    standardHeaders: boolean;
    legacyHeaders: boolean;
};
