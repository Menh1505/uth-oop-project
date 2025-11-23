import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { aiConfig } from './config/config.js';
import { AIService } from './services/AIService.js';
import { MessageService } from './services/MessageService.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import logger from './config/logger.js';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: aiConfig.corsOrigin,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type')
  });
  next();
});

// Routes
app.use('/ai', aiRoutes);

// Root health check
app.get('/', (req, res) => {
  res.json({
    service: 'ai-service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await MessageService.close();
    logger.info('Message service closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function startServer() {
  try {
    // Initialize AI Service
    AIService.initialize();
    logger.info('AI Service initialized');

    // Connect to RabbitMQ
    try {
      await MessageService.connect();
      logger.info('Message Service connected');
    } catch (msgError) {
      logger.error('Failed to connect MessageService - service will continue without messaging', {
        error: msgError
      });
    }

    // Start HTTP server
    app.listen(aiConfig.port, () => {
      logger.info('AI service started successfully', {
        port: aiConfig.port,
        nodeEnv: aiConfig.nodeEnv,
        openaiModel: aiConfig.openaiModel
      });
    });

  } catch (error) {
    logger.error('Failed to start AI service', { error });
    process.exit(1);
  }
}

startServer();