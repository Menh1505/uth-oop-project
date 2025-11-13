import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HTTPServer } from 'http';
import { DeliveryService } from './services/DeliveryService';
import { DeliveryController } from './controllers/DeliveryController';
import { DeliveryRoutes } from './routes/deliveryRoutes';
import { WebSocketManager } from './middleware/websocketMiddleware';
import { errorHandler, notFound } from './middleware/errorHandler';
import Database from './config/database';

export class App {
  private app: Application;
  private server: HTTPServer;
  private webSocketManager: WebSocketManager;
  private database: Database;
  private deliveryService: DeliveryService;
  private deliveryController: DeliveryController;
  private deliveryRoutes: DeliveryRoutes;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    
    // Initialize database
    this.database = Database.getInstance();
    
    // Initialize services and controllers
    this.deliveryService = new DeliveryService(this.database.getPool());
    this.deliveryController = new DeliveryController(this.deliveryService);
    this.deliveryRoutes = new DeliveryRoutes(this.deliveryController);
    
    // Initialize WebSocket manager
    this.webSocketManager = new WebSocketManager(this.server);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count']
    }));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: process.env.JSON_LIMIT || '10mb',
      verify: (req, res, buf, encoding) => {
        // Verify JSON payload integrity
        try {
          JSON.parse(buf.toString());
        } catch (error) {
          throw new Error('Invalid JSON payload');
        }
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: process.env.URL_ENCODED_LIMIT || '10mb' 
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        error: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health';
      }
    });

    this.app.use('/api', limiter);

    // Request logging middleware
    this.app.use((req: Request, res: Response, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Request:', logData);
        }
      });
      
      next();
    });

    // Health check middleware (before authentication)
    this.app.use('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Delivery service is running',
        timestamp: new Date().toISOString(),
        service: 'delivery-service',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      });
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api', this.deliveryRoutes.getRouter());

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Welcome to Delivery Service API',
        version: process.env.npm_package_version || '1.0.0',
        documentation: '/api/docs',
        health: '/health',
        websocket: '/socket.io'
      });
    });

    // API documentation endpoint
    this.app.get('/api/docs', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Delivery Service API Documentation',
        endpoints: {
          drivers: {
            'POST /api/drivers': 'Create new driver',
            'GET /api/drivers': 'Get all drivers',
            'GET /api/drivers/:id': 'Get driver by ID',
            'PUT /api/drivers/:id': 'Update driver',
            'PUT /api/drivers/:id/location': 'Update driver location',
            'PUT /api/drivers/:id/status': 'Update driver status',
            'GET /api/drivers/available': 'Get available drivers'
          },
          deliveries: {
            'POST /api/deliveries': 'Create new delivery',
            'GET /api/deliveries': 'Get all deliveries',
            'GET /api/deliveries/:id': 'Get delivery by ID',
            'PUT /api/deliveries/:id': 'Update delivery',
            'POST /api/deliveries/:id/assign': 'Assign driver',
            'POST /api/deliveries/:id/auto-assign': 'Auto-assign driver',
            'PUT /api/deliveries/:id/proof': 'Update delivery proof'
          },
          tracking: {
            'GET /api/deliveries/:id/tracking': 'Get tracking events',
            'POST /api/deliveries/:id/tracking': 'Create tracking event'
          },
          analytics: {
            'GET /api/analytics/deliveries': 'Get delivery analytics',
            'GET /api/analytics/drivers': 'Get driver analytics'
          },
          integration: {
            'POST /api/integration/order-created': 'Handle order creation',
            'POST /api/integration/calculate-fee': 'Calculate delivery fee'
          }
        },
        websocket_events: {
          'location:update': 'Driver location updates',
          'delivery:status:update': 'Delivery status changes',
          'driver:status:update': 'Driver status changes',
          'notification': 'System notifications'
        }
      });
    });

    // WebSocket info endpoint
    this.app.get('/api/websocket/info', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'WebSocket connection information',
        endpoint: '/socket.io',
        transports: ['websocket', 'polling'],
        authentication: 'JWT token in auth.token or Authorization header',
        events: {
          client_events: [
            'location:update',
            'delivery:status:update',
            'driver:status:update',
            'delivery:subscribe',
            'delivery:unsubscribe'
          ],
          server_events: [
            'location:update',
            'delivery:status:update',
            'driver:status:update',
            'notification'
          ]
        }
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);

    // Graceful shutdown handlers
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdown(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown(1);
    });
  }

  public async start(): Promise<void> {
    const port = parseInt(process.env.PORT || '3004');
    const host = process.env.HOST || '0.0.0.0';

    try {
      // Test database connection
      const isDbHealthy = await this.database.healthCheck();
      if (!isDbHealthy) {
        throw new Error('Database connection failed');
      }

      this.server.listen(port, host, () => {
        console.log(`🚚 Delivery Service running on ${host}:${port}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔌 WebSocket enabled on ws://${host}:${port}/socket.io`);
        console.log(`📖 API Documentation: http://${host}:${port}/api/docs`);
        console.log(`❤️  Health Check: http://${host}:${port}/health`);
        
        // Log connected services info
        console.log('🔗 Service Integration:');
        console.log(`   - Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
        console.log(`   - Auth Service: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`);
        console.log(`   - Order Service: ${process.env.ORDER_SERVICE_URL || 'http://localhost:3002'}`);
        console.log(`   - Partner Service: ${process.env.PARTNER_SERVICE_URL || 'http://localhost:3005'}`);
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async shutdown(code: number = 0): Promise<void> {
    console.log('🛑 Shutting down Delivery Service...');

    try {
      // Close WebSocket connections
      this.webSocketManager.close();
      console.log('✅ WebSocket connections closed');

      // Close HTTP server
      await new Promise<void>((resolve, reject) => {
        this.server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      console.log('✅ HTTP server closed');

      // Close database connections
      await this.database.close();
      console.log('✅ Database connections closed');

      console.log('👋 Delivery Service shut down successfully');
      process.exit(code);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }

  public getServer(): HTTPServer {
    return this.server;
  }

  public getWebSocketManager(): WebSocketManager {
    return this.webSocketManager;
  }

  public getDatabase(): Database {
    return this.database;
  }
}