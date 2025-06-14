"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
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
        // Type assertion to handle the request
        req.userId = decoded.userId || '507f1f77bcf86cd799439011';
        req.user = {
            id: decoded.userId || '507f1f77bcf86cd799439011',
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
//# sourceMappingURL=auth.js.map