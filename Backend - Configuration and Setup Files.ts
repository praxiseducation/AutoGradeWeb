
// config/config.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Database
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/autograde',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // Redis (for queue)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d'
  },
  
  // CORS
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3001').split(',')
  },
  
  // File Storage
  storage: {
    type: process.env.STORAGE_TYPE || 's3', // 's3' or 'local'
    s3: {
      bucket: process.env.AWS_S3_BUCKET || '',
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    },
    local: {
      uploadDir: path.join(__dirname, '../../uploads')
    }
  },
  
  // OCR Services
  googleVision: {
    apiKey: process.env.GOOGLE_VISION_API_KEY || '',
    projectId: process.env.GOOGLE_PROJECT_ID || ''
  },
  
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
    maxTokens: 4000,
    temperature: 0
  },
  
  // Email
  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid', // 'sendgrid' or 'smtp'
    from: process.env.EMAIL_FROM || 'noreply@autograde.com',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || ''
    },
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    }
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
};

// config/database.ts
import mongoose from 'mongoose';
import { config } from './config';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    logger.info('Database connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

// package.json
{
  "name": "autograde-backend",
  "version": "1.0.0",
  "description": "Backend API for AutoGrade - Automated grading system",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "nodemon --watch src --exec ts-node src/server.ts",
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "migrate": "ts-node src/scripts/migrate.ts",
    "seed": "ts-node src/scripts/seed.ts"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "@sendgrid/mail": "^7.7.0",
    "axios": "^1.6.0",
    "bcryptjs": "^2.4.3",
    "bull": "^4.11.0",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.0",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0",
    "multer": "^1.4.5-lts.1",
    "multer-s3": "^3.0.1",
    "pdfkit": "^0.14.0",
    "qrcode": "^1.5.3",
    "redis": "^4.6.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/bull": "^4.10.0",
    "@types/compression": "^1.7.5",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.0",
    "@types/pdfkit": "^0.13.0",
    "@types/qrcode": "^1.5.5",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "eslint": "^8.55.0",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "prettier": "^3.1.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.3.0"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
