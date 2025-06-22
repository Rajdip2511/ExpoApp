import { JWTPayload } from '../types';
export interface User {
    id: string;
    name: string;
    email: string;
    password: string | null;
    avatar?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Generate JWT token for user
 */
export declare const generateToken: (user: User) => string;
/**
 * Verify and decode JWT token or static token
 */
export declare const verifyToken: (token: string) => JWTPayload | null;
/**
 * Hash password using bcrypt
 */
export declare const hashPassword: (password: string) => Promise<string>;
/**
 * Compare password with hash
 */
export declare const comparePassword: (password: string, hash: string | null) => Promise<boolean>;
/**
 * Extract token from Authorization header
 */
export declare const extractTokenFromHeader: (authHeader?: string) => string | null;
/**
 * Generate random avatar URL (placeholder for demo)
 */
export declare const generateAvatarUrl: (name: string) => string;
/**
 * Validate email format
 */
export declare const isValidEmail: (email: string) => boolean;
/**
 * Validate password strength
 */
export declare const isValidPassword: (password: string) => {
    valid: boolean;
    message?: string;
};
/**
 * Get user-safe data (exclude password)
 */
export declare const getSafeUserData: (user: User) => Omit<User, "password">;
