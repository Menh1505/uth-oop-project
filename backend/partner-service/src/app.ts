import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import partnerRoutes from './routes/partnerRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

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

// Stricter rate limiting for partner registration
const partnerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit partner registration to 5 requests per hour
  message: {
    success: false,
    error: 'Too many partner registration attempts, please try again later'
  }
});

// ============= BODY PARSING =============
app.use(express.json({ limit: '10mb' }));
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
    service: 'partner-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      restaurant_management: 'available',
      menu_management: 'available',
      promotion_system: 'available',
      inventory_tracking: 'available',
      analytics: 'available'
    }
  });
});

// ============= API ROUTES =============
// Apply partner-specific rate limiting for registration
app.use('/api/partners', partnerLimiter);

// Apply all routes
app.use('/api', partnerRoutes);

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