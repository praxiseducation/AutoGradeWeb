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
    
    // Type assertion to handle the request
    (req as AuthRequest).userId = decoded.userId || '507f1f77bcf86cd799439011';
    (req as AuthRequest).user = {
      id: decoded.userId || '507f1f77bcf86cd799439011',
      email: decoded.email || 'test@example.com',
      name: decoded.name || 'Test User'
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(403).json({ error: 'Invalid token' });
    return;
  }
};
