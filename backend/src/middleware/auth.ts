import { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken, extractTokenFromHeader } from '../utils/auth';
import prisma from '../utils/database';
import { Context } from '../types';

// Interface for extended request with user
export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Middleware to extract and verify JWT token from request headers
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided - continue without authentication
      return next();
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      // Invalid token - continue without authentication
      return next();
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
        // Exclude password from selection
      }
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    // Continue without authentication on error
    next();
  }
};

/**
 * Create GraphQL context with authenticated user and Socket.io server
 */
export const createContext = (io?: SocketIOServer) => 
  async ({ req, res }: { req: AuthenticatedRequest; res: Response }): Promise<Context> => {
    return {
      user: req.user,
      req,
      res,
      io, // Include Socket.io server instance
    };
  };

/**
 * Middleware to require authentication
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please provide a valid authentication token'
    });
    return;
  }
  next();
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
}; 