import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRoutes from './routes/UserRoutes';
import { errorHandler } from './middleware/errorHandler';
import { MessageConsumer } from './services/messageConsumer';
import { UserController } from './controllers/UserController';
import logger from './config/logger';

const app = express();

// Health check endpoint (FIRST - before any middleware that could interfere)
app.get('/health', (req: Request, res: Response) => {
  const healthData = {
    status: 'OK',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: 'connected'
  };
  res.json(healthData);
});

// Basic middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'Request received');
  next();
});

// Public authentication routes (no auth required)
app.post('/register', async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const { UserService } = await import('./services/UserService');
    const newUser = await UserService.registerUser(userData);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const { UserService } = await import('./services/UserService');
    const user = await UserService.loginUser({ email, password });
    const needsOnboarding = await UserService.needsOnboarding(user.user_id);

    res.json({
      success: true,
      message: 'Login successful',
      user,
      needsOnboarding
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

app.get('/status', (req: Request, res: Response) => {
  res.json({
    service: 'user-service',
    status: 'healthy',
    version: '2.0.0',
    database: process.env.DB_NAME || 'user_db',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /register',
      'POST /login', 
      'GET /status',
      'GET /health',
      'GET /users/me (protected)',
      'PUT /users/me (protected)',
    ]
  });
});

// ./Protected routes under /users
app.use('/users', userRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

async function startServer() {
  try {
    // Debug database connection
    console.log('Database connection config:', {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'user_db',
      password: process.env.DB_PASSWORD ? '***' : 'password_not_set',
      port: process.env.DB_PORT || '5432'
    });

    const server = app.listen(PORT, () => {
      logger.info({ port: PORT }, 'User service started successfully');
    });

    // Start RabbitMQ consumer
    try {
      await MessageConsumer.start();
      logger.info('MessageConsumer started successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to start MessageConsumer - service will continue without messaging');
      // Don't exit - service can work without message consumer
    }

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down user service...');
      
      server.close((err: Error | undefined) => {
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

    // Handle signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error({ error }, 'Uncaught Exception');
      void shutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error({ reason, promise }, 'Unhandled Rejection');
      void shutdown();
    });

  } catch (error) {
    logger.error({ error }, 'Failed to start user service');
    process.exit(1);
  }
}

// Start the server
startServer();
