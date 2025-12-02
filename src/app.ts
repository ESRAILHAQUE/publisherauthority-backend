import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import config from './config/env';
import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import notFound from './middleware/notFound';
import moduleRoutes from './modules';

/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */
const app: Application = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // If CORS_ORIGIN is '*', allow all origins
      if (config.CORS_ORIGIN === '*') {
        return callback(null, true);
      }
      
      // Parse comma-separated origins
      const allowedOrigins = config.CORS_ORIGIN.split(',').map(o => o.trim());
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, log the origin for debugging
        if (config.NODE_ENV === 'development') {
          logger.warn(`CORS: Origin ${origin} not in allowed list: ${allowedOrigins.join(', ')}`);
        }
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// ============================================
// GENERAL MIDDLEWARE
// ============================================

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// HTTP request logger (only in development)
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
}

// ============================================
// ROUTES
// ============================================

// Health check route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Publisher Authority API is running - Auto Deploy Test Successful! 🚀',
    version: '1.0.1',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    deployment: 'CI/CD Pipeline Active',
  });
});

// API health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
// Support both /api/v1 and /v1 (in case reverse proxy strips /api)
app.use('/api/v1', moduleRoutes);
app.use('/v1', moduleRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - must be after all other routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

export default app;
