import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import middleware from './middleware';

// Load environment variables
dotenv.config();

export function createApp() {
  const app = express();

  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.use(cors({
    origin: allowedOrigins,
    credentials: true
  }));

  // Custom middleware
  app.use(middleware.requestLogger);
  app.use(middleware.rateLimiter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'recommendation-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  // API routes
  app.use('/api', middleware.validateUserData);
  app.use('/api', routes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found'
    });
  });

  // Error handling middleware (must be last)
  app.use(middleware.errorHandler);

  return app;
}

export default createApp;