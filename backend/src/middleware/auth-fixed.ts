import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
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
    const decoded: any = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'secret');
    
    // Check if userId exists in the token
    if (!decoded.userId) {
      res.status(401).json({ error: 'Invalid token: missing userId' });
      return;
    }
    
    // Type assertion to handle the request
    (req as AuthRequest).userId = decoded.userId;
    (req as AuthRequest).user = {
      id: decoded.userId,
      email: decoded.email || 'test@example.com',
      name: decoded.name || 'Test User'
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(403).json({ error: 'Invalid token' });
    return;
  }
}

// Optional: Add a development-only middleware for testing
export const devAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development') {
    // Use a real ObjectId from your database for testing
    (req as AuthRequest).userId = process.env.TEST_USER_ID || '';
    (req as AuthRequest).user = {
      id: process.env.TEST_USER_ID || '',
      email: 'dev@test.com',
      name: 'Dev User'
    };
    next();
  } else {
    authenticateToken(req, res, next);
  }
}
