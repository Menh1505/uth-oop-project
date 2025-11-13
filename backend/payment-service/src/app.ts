import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import paymentRoutes from './routes/paymentRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { PAYMENT_CONFIG } from './config/payment';

const app = express();

// ============= SECURITY MIDDLEWARE =============
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ============= RATE LIMITING =============
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limiting for payment creation
const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit payment creation to 10 requests per 5 minutes
  message: {
    success: false,
    error: 'Too many payment attempts, please try again later'
  }
});

// ============= BODY PARSING =============
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============= REQUEST LOGGING =============
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// ============= HEALTH CHECK =============
app.get('/health', (req, res) => {
  res.json({
    service: 'payment-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    config: {
      gateways: {
        apple_pay: !!PAYMENT_CONFIG.APPLE_PAY.MERCHANT_ID,
        payos: !!PAYMENT_CONFIG.PAYOS.CLIENT_ID,
        mock_gateway: true
      }
    }
  });
});

// ============= API ROUTES =============
// Apply payment-specific rate limiting
app.use('/api/payments', paymentLimiter);
app.use('/api/apple-pay', paymentLimiter);
app.use('/api/payos', paymentLimiter);

// Apply all routes
app.use('/api', paymentRoutes);

// ============= ERROR HANDLING =============
app.use(notFoundHandler);
app.use(errorHandler);

// ============= GRACEFUL SHUTDOWN =============
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;