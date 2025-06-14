"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.devAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }
    try {
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Invalid token format' });
            return;
        }
        // For development, use a simplified approach
        const decoded = jsonwebtoken_1.default.verify(token, process.env.NEXTAUTH_SECRET || 'secret');
        // Check if userId exists in the token
        if (!decoded.userId) {
            res.status(401).json({ error: 'Invalid token: missing userId' });
            return;
        }
        // Type assertion to handle the request
        req.userId = decoded.userId;
        req.user = {
            id: decoded.userId,
            email: decoded.email || 'test@example.com',
            name: decoded.name || 'Test User'
        };
        next();
    }
    catch (error) {
        console.error('Auth error:', error);
        res.status(403).json({ error: 'Invalid token' });
        return;
    }
};
exports.authenticateToken = authenticateToken;
// Optional: Add a development-only middleware for testing
const devAuth = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        // Use a real ObjectId from your database for testing
        req.userId = process.env.TEST_USER_ID || '';
        req.user = {
            id: process.env.TEST_USER_ID || '',
            email: 'dev@test.com',
            name: 'Dev User'
        };
        next();
    }
    else {
        (0, exports.authenticateToken)(req, res, next);
    }
};
exports.devAuth = devAuth;
//# sourceMappingURL=auth-fixed.js.map