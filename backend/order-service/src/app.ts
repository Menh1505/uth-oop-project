import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import orderRoutes from './routes/orderRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// ============= SECURITY MIDDLEWARE =============
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// ============= GENERAL MIDDLEWARE =============
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============= ROUTES =============
app.use('/api/orders', orderRoutes);

// Root endpoint with service information
app.get('/', (req, res) => {
  res.json({
    service: 'order-service',
    status: 'running',
    version: '1.0.0',
    description: 'Food ordering system with complete order lifecycle management',
    endpoints: {
      health: 'GET /api/orders/health',
      orders: {
        create: 'POST /api/orders',
        list: 'GET /api/orders',
        get: 'GET /api/orders/:id',
        update: 'PUT /api/orders/:id',
        delete: 'DELETE /api/orders/:id'
      },
      statusManagement: {
        updateStatus: 'PUT /api/orders/:id/status',
        statusHistory: 'GET /api/orders/:id/status-history',
        cancel: 'POST /api/orders/:id/cancel',
        confirm: 'POST /api/orders/:id/confirm',
        ready: 'POST /api/orders/:id/ready',
        delivered: 'POST /api/orders/:id/delivered'
      },
      analytics: {
        userStats: 'GET /api/orders/analytics/stats',
        globalStats: 'GET /api/orders/admin/stats (Admin)',
        allOrders: 'GET /api/orders/admin/all (Admin)'
      }
    },
    features: [
      'Complete order lifecycle management',
      'Real-time status tracking',
      'Multiple delivery types (Delivery, Pickup, Dine-in)',
      'Order priority management',
      'Financial calculations with tax and fees',
      'Customer information management',
      'Order analytics and reporting',
      'Status history tracking',
      'Admin dashboard support'
    ],
    orderStatuses: [
      'PENDING - Order created, awaiting confirmation',
      'CONFIRMED - Order confirmed, ready for preparation',
      'PREPARING - Food is being prepared',
      'READY - Order ready for pickup/delivery',
      'OUT_FOR_DELIVERY - Order out for delivery',
      'DELIVERED - Order successfully delivered',
      'CANCELLED - Order cancelled',
      'REFUNDED - Order refunded'
    ],
    paymentStatuses: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    deliveryTypes: ['DELIVERY', 'PICKUP', 'DINE_IN'],
    orderPriorities: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    timestamp: new Date().toISOString()
  });
});

// ============= ERROR HANDLING =============
app.use(notFoundHandler);
app.use(errorHandler);

export default app;