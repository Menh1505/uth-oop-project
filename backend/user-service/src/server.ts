import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';
import { MessageConsumer } from './services/messageConsumer';
import logger from './config/logger';

const app = express();

// Logging middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'Request received');
  next();
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const status = MessageConsumer['connection'] ? 'OK' : 'WARNING';
  const healthData = {
    status,
    service: 'user-service',
    timestamp: new Date().toISOString(),
    rabbitmq: status === 'OK' ? 'connected' : 'disconnected',
    database: 'connected'
  };
  logger.info(healthData, 'Health check');
  res.json(healthData);
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, async () => {
  logger.info({ port: PORT }, 'User service started');
  
  // Start RabbitMQ consumer with retry
  try {
    await MessageConsumer.start();
  } catch (error) {
    logger.error({ error }, 'Failed to start MessageConsumer');
    process.exit(1);
  }
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down user service...');
  
  // Close HTTP server
  server.close(async (err) => {
    if (err) {
      logger.error({ error: err }, 'Error closing HTTP server');
      process.exit(1);
    }
    
    // Close RabbitMQ connection
    try {
      await MessageConsumer.close();
      logger.info('Successfully shut down user service');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  });
};

// Handle signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  void shutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
  void shutdown();
});
