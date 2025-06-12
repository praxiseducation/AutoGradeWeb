// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { User } from '../models/User';
import { logger } from '../utils/logger';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('email role isActive');
    
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid authentication' });
      return;
    }
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
};

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

// middleware/validateRequest.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg
      }))
    });
    return;
  }
  
  next();
};

// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  }
  
  // Log error
  logger.error({
    error: error.message,
    stack: error.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  // Send response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  });
};

// utils/logger.ts
import winston from 'winston';
import { config } from '../config/config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  config.logging.format === 'json'
    ? winston.format.json()
    : winston.format.simple()
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// utils/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config/config';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpiry
  });
  
  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshTokenExpiry
  });
  
  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

// utils/csvParser.ts
import * as csv from 'csv-parse';
import { Readable } from 'stream';

export interface ParsedStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export const parseCSV = (buffer: Buffer): Promise<ParsedStudent[]> => {
  return new Promise((resolve, reject) => {
    const results: ParsedStudent[] = [];
    const stream = Readable.from(buffer);
    
    stream
      .pipe(csv.parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (row) => {
        // Try to identify columns intelligently
        const student: ParsedStudent = {
          studentId: row['Student ID'] || row['ID'] || row['student_id'] || '',
          firstName: row['First Name'] || row['FirstName'] || row['first_name'] || '',
          lastName: row['Last Name'] || row['LastName'] || row['last_name'] || '',
          email: row['Email'] || row['email'] || undefined
        };
        
        // Alternative: full name in one column
        if (!student.firstName && !student.lastName && (row['Name'] || row['Student Name'])) {
          const fullName = row['Name'] || row['Student Name'];
          const parts = fullName.split(' ');
          student.firstName = parts[0] || '';
          student.lastName = parts.slice(1).join(' ') || '';
        }
        
        if (student.studentId && student.firstName) {
          results.push(student);
        }
      })
      .on('error', reject)
      .on('end', () => resolve(results));
  });
};

// utils/email.service.ts
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter?: nodemailer.Transporter;

  constructor() {
    if (config.email.provider === 'sendgrid') {
      sgMail.setApiKey(config.email.sendgrid.apiKey);
    } else {
      this.transporter = nodemailer.createTransport(config.email.smtp);
    }
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const emailData = {
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      if (config.email.provider === 'sendgrid') {
        await sgMail.send(emailData);
      } else if (this.transporter) {
        await this.transporter.sendMail(emailData);
      }

      logger.info(`Email sent to ${options.to}`);
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcome(email: string, name: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    await this.send({
      to: email,
      subject: 'Welcome to AutoGrade',
      html: `
        <h1>Welcome to AutoGrade, ${name}!</h1>
        <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background: #4285F4; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
      `
    });
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    await this.send({
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #4285F4; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `
    });
  }

  async sendGradeReport(email: string, reportUrl: string, periodName: string): Promise<void> {
    await this.send({
      to: email,
      subject: `Grade Report - ${periodName}`,
      html: `
        <h1>Grade Report Ready</h1>
        <p>Your grade report for ${periodName} is ready for download.</p>
        <a href="${reportUrl}" style="display: inline-block; padding: 10px 20px; background: #34A853; color: white; text-decoration: none; border-radius: 5px;">Download Report</a>
        <p>This link will expire in 24 hours.</p>
      `
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}

export const emailService = new EmailService();

// services/storage.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class StorageService {
  private s3Client?: S3Client;

  constructor() {
    if (config.storage.type === 's3') {
      this.s3Client = new S3Client({
        region: config.storage.s3.region,
        credentials: {
          accessKeyId: config.storage.s3.accessKeyId,
          secretAccessKey: config.storage.s3.secretAccessKey
        }
      });
    }
  }

  async uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
    if (config.storage.type === 's3' && this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: config.storage.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
      });
      
      await this.s3Client.send(command);
      return `https://${config.storage.s3.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${key}`;
    } else {
      // Local storage
      const filePath = path.join(config.storage.local.uploadDir, key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, buffer);
      return `/uploads/${key}`;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (config.storage.type === 's3' && this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: config.storage.s3.bucket,
        Key: key
      });
      
      return getSignedUrl(this.s3Client, command, { expiresIn });
    } else {
      // For local storage, return the direct URL
      return `/uploads/${key}`;
    }
  }

  async downloadFile(url: string): Promise<Buffer> {
    if (url.startsWith('http')) {
      // Download from URL
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else {
      // Local file
      const filePath = path.join(config.storage.local.uploadDir, url.replace('/uploads/', ''));
      return fs.readFile(filePath);
    }
  }

  generateKey(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = path.extname(filename);
    return `${prefix}/${timestamp}-${randomString}${extension}`;
  }
}
