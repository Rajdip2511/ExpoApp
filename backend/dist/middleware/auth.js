"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimit = exports.requireAuth = exports.createContext = exports.authenticateToken = void 0;
const auth_1 = require("../utils/auth");
const database_1 = __importDefault(require("../utils/database"));
/**
 * Middleware to extract and verify JWT token from request headers
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, auth_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            // No token provided - continue without authentication
            return next();
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            // Invalid token - continue without authentication
            return next();
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
                // Exclude password from selection
            }
        });
        if (user) {
            req.user = user;
        }
        next();
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        // Continue without authentication on error
        next();
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Create GraphQL context with authenticated user
 */
const createContext = ({ req, res }) => {
    return {
        user: req.user,
        req,
        res,
    };
};
exports.createContext = createContext;
/**
 * Middleware to require authentication
 */
const requireAuth = (req, res, next) => {
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
exports.requireAuth = requireAuth;
/**
 * Rate limiting middleware for authentication endpoints
 */
exports.authRateLimit = {
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
