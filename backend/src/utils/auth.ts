import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload } from '../types';

// Define User type locally until Prisma types are available
export interface User {
  id: string;
  name: string;
  email: string;
  password: string | null;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 */
export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

// Static token mappings for demo purposes
const STATIC_TOKENS: Record<string, JWTPayload> = {
  'demo-token-123': { userId: 'demo-user-id', email: 'demo@example.com' },
  'john-token-456': { userId: 'john-user-id', email: 'john@example.com' },
  'jane-token-789': { userId: 'jane-user-id', email: 'jane@example.com' },
  'alice-token-101': { userId: 'alice-user-id', email: 'alice@example.com' },
  'bob-token-202': { userId: 'bob-user-id', email: 'bob@example.com' },
};

/**
 * Verify and decode JWT token or static token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  // First, check if it's a static token
  if (STATIC_TOKENS[token]) {
    return STATIC_TOKENS[token];
  }

  // If not a static token, try JWT verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string | null): Promise<boolean> => {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Generate random avatar URL (placeholder for demo)
 */
export const generateAvatarUrl = (name: string): string => {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&size=150&background=random&color=ffffff&bold=true`;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 100) {
    return { valid: false, message: 'Password must be less than 100 characters long' };
  }
  
  return { valid: true };
};

/**
 * Get user-safe data (exclude password)
 */
export const getSafeUserData = (user: User): Omit<User, 'password'> => {
  const { password, ...safeUser } = user;
  return safeUser;
}; 