import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { MessageConsumer } from './services/messageConsumer.js';
import logger from './config/logger.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Connect to MongoDB
connectDB();

// ===== Health check endpoints =====

// Health check cực nhẹ cho k8s / docker / gateway
app.get('/health', (req: Request, res: Response) => {
  const healthData = {
    status: 'OK',
    service: 'user-service',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  };
  res.json(healthData);
});

// Status chi tiết (debug / dev)
app.get('/status', (req: Request, res: Response) => {
  res.json({
    service: 'user-service',
    status: 'healthy',
    version: '2.0.0',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /register',
      'POST /login',
      'GET /status',
      'GET /health',
      'GET /users/me (protected)',
      'PUT /users/me (protected)',
    ],
  });
});

// ===== Global middleware =====

// CORS
app.use(cors());

// Body parser – tăng limit để nuốt được base64 avatar (~6–7MB cho file 5MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging từng request
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(
    {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    },
    'Request received',
  );
  next();
});

// ===== Public auth routes (không cần auth middleware) =====

app.post('/register', async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const { UserService } = await import('./services/UserService.js');

    const newUser = await UserService.registerUser(userData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser,
    });
  } catch (error: any) {
    logger.error({ error }, 'Registration error');
    res.status(400).json({
      success: false,
      message: error?.message || 'Registration failed',
    });
  }
});

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const { UserService } = await import('./services/UserService.js');
    const user = await UserService.loginUser({ email, password });
    const needsOnboarding = await UserService.needsOnboarding(user.user_id);

    res.json({
      success: true,
      message: 'Login successful',
      user,
      needsOnboarding,
    });
  } catch (error: any) {
    logger.error({ error }, 'Login error');
    res.status(401).json({
      success: false,
      message: error?.message || 'Login failed',
    });
  }
});

// ===== Protected routes dưới prefix /users =====

app.use('/users', userRoutes);

// ===== Error handler (luôn đặt cuối) =====

app.use(errorHandler);

// ===== Server bootstrap + graceful shutdown =====

async function startServer() {
  try {
    // Log MongoDB connection info
    logger.info(
      {
        mongodb_uri: process.env.MONGODB_URI ? '[SET]' : '[DEFAULT]',
        database: 'fitfood_user_db'
      },
      'MongoDB connection config',
    );

    const server = app.listen(PORT, () => {
      logger.info({ port: PORT }, 'User service started successfully');
    });

    // Start RabbitMQ consumer (không kill service nếu fail)
    try {
      await MessageConsumer.start();
      logger.info('MessageConsumer started successfully');
    } catch (error) {
      logger.error(
        { error },
        'Failed to start MessageConsumer - service will continue without messaging',
      );
    }

    const shutdown = async () => {
      logger.info('Shutting down user service...');

      server.close((err?: Error) => {
        if (err) {
          logger.error({ error: err }, 'Error closing HTTP server');
          process.exit(1);
        }

        MessageConsumer.close()
          .then(() => {
            logger.info('Successfully shut down user service');
            process.exit(0);
          })
          .catch((error) => {
            logger.error({ error }, 'Error during shutdown');
            process.exit(1);
          });
      });
    };

    // OS signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error({ error }, 'Uncaught Exception');
      void shutdown();
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error({ reason, promise }, 'Unhandled Rejection');
      void shutdown();
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start user service');
    process.exit(1);
  }
}

// Start the server
startServer().catch((err) => {
  logger.error({ err }, 'Error while starting server');
  process.exit(1);
});

export default app;
