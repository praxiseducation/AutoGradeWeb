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
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false,
    "sourceMap": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}

// .env.example
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/autograde

# Redis (for job queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGINS=http://localhost:3001,http://localhost:3000

# Storage (s3 or local)
STORAGE_TYPE=s3
AWS_S3_BUCKET=autograde-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# OCR Services
GOOGLE_VISION_API_KEY=your-google-vision-api-key
GOOGLE_PROJECT_ID=your-google-project-id

CLAUDE_API_KEY=your-claude-api-key
CLAUDE_MODEL=claude-3-sonnet-20240229

# Email (sendgrid or smtp)
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@autograde.com
SENDGRID_API_KEY=your-sendgrid-api-key

# SMTP (if using smtp instead of sendgrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

// .gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
dist/
build/
*.tsbuildinfo

# Logs
logs/
*.log

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Test coverage
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
uploads/

# Docker
docker-compose.override.yml

// docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: autograde
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  backend:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://admin:password@mongodb:27017/autograde?authSource=admin
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./src:/app/src
      - ./uploads:/app/uploads

volumes:
  mongodb_data:
  redis_data:

// Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

# Set user to non-root
USER node

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]

// README.md
# AutoGrade Backend API

Backend service for the AutoGrade automated grading system.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 📊 Student roster management with CSV/Excel import
- 📄 PDF grade sheet generation with QR codes
- 🔍 OCR processing with Google Vision and Claude AI
- 📦 Batch processing with Bull queue
- 🗄️ MongoDB database with Mongoose ODM
- 🚀 Scalable architecture with Redis caching
- 📧 Email notifications with SendGrid/SMTP
- 🔒 Security with Helmet, CORS, and rate limiting

## Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 6+
- Google Vision API key
- Claude API key (optional)
- AWS S3 credentials (for file storage)

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/autograde-backend.git
cd autograde-backend
```

2. Install dependencies
```bash
npm install
```

3. Copy environment variables
```bash
cp .env.example .env
```

4. Configure your `.env` file with your credentials

5. Run database migrations
```bash
npm run migrate
```

## Development

Start the development server:
```bash
npm run dev
```

Run with Docker:
```bash
docker-compose up
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Rosters
- `POST /api/rosters/upload` - Upload roster CSV/Excel
- `POST /api/rosters/import-sheets` - Import from Google Sheets
- `GET /api/rosters/period/:periodId` - Get roster for period
- `PUT /api/rosters/period/:periodId` - Update roster

### Grade Sheets
- `POST /api/gradesheets/generate` - Generate grade sheets
- `GET /api/gradesheets/:id` - Get grade sheet
- `GET /api/gradesheets/:id/download` - Download as PDF
- `POST /api/gradesheets/download-batch` - Download multiple

### Processing
- `POST /api/process/upload` - Upload and process scanned sheets
- `GET /api/process/job/:jobId` - Get processing status
- `POST /api/process/job/:jobId/retry` - Retry failed job

### Export
- `GET /api/export/csv` - Export grades as CSV
- `POST /api/export/google-sheets` - Export to Google Sheets
- `GET /api/export/pdf/report` - Generate grade report

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Architecture

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── server.ts       # Application entry point
```

## License

MIT
