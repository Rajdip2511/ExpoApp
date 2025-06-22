"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSafeUserData = exports.isValidPassword = exports.isValidEmail = exports.generateAvatarUrl = exports.extractTokenFromHeader = exports.comparePassword = exports.hashPassword = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
exports.generateToken = generateToken;
// Static token mappings for demo purposes
const STATIC_TOKENS = {
    'demo-token-123': { userId: 'demo-user-id', email: 'demo@example.com' },
    'john-token-456': { userId: 'john-user-id', email: 'john@example.com' },
    'jane-token-789': { userId: 'jane-user-id', email: 'jane@example.com' },
    'alice-token-101': { userId: 'alice-user-id', email: 'alice@example.com' },
    'bob-token-202': { userId: 'bob-user-id', email: 'bob@example.com' },
};
/**
 * Verify and decode JWT token or static token
 */
const verifyToken = (token) => {
    // First, check if it's a static token
    if (STATIC_TOKENS[token]) {
        return STATIC_TOKENS[token];
    }
    // If not a static token, try JWT verification
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
};
exports.verifyToken = verifyToken;
/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
    const saltRounds = 12;
    return bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
    if (!hash)
        return false;
    return bcryptjs_1.default.compare(password, hash);
};
exports.comparePassword = comparePassword;
/**
 * Extract token from Authorization header
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
/**
 * Generate random avatar URL (placeholder for demo)
 */
const generateAvatarUrl = (name) => {
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=150&background=random&color=ffffff&bold=true`;
};
exports.generateAvatarUrl = generateAvatarUrl;
/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
/**
 * Validate password strength
 */
const isValidPassword = (password) => {
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    if (password.length > 100) {
        return { valid: false, message: 'Password must be less than 100 characters long' };
    }
    return { valid: true };
};
exports.isValidPassword = isValidPassword;
/**
 * Get user-safe data (exclude password)
 */
const getSafeUserData = (user) => {
    const { password, ...safeUser } = user;
    return safeUser;
};
exports.getSafeUserData = getSafeUserData;
