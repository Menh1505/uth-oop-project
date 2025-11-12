// Import telemetry first (before any other imports)
import './config/telemetry';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config';
import { MetricsService } from './services/MetricsService';
import gatewayRoutes from './routes/gatewayRoutes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from "./middleware/rateLimitMiddleware";
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize metrics
MetricsService.initialize();

// Request logging middleware
app.use((req, res, next) => {
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    MetricsService.recordHistogram('gateway_http_request_duration_ms', duration, {
      method: req.method,
      status: res.statusCode.toString(),
      path: req.path,
    });
  });
  
  next();
});

app.use((req, res, next) => {
  console.log("================================")
  console.log(`➡️  ${req.method} ${req.originalUrl}`);

  if (Object.keys(req.query).length) {
    console.log(" 🔹 Query:", req.query);
  }

  if (Object.keys(req.body).length) {
    console.log(" 🔸 Body:", req.body);
  }
  console.log("================================")
  next();
});
// Routes
app.use("/", rateLimitMiddleware , gatewayRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({
    service: 'API Gateway',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      info: '/info',
      apis: '/api/*',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  MetricsService.incrementCounter('gateway_requests_total', {
    method: req.method,
    status: '404',
    service: 'gateway',
  });
  
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Gateway Service running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`🔍 Health check at http://localhost:${PORT}/health`);
  console.log(`📖 Info at http://localhost:${PORT}/info`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Gateway Service shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Gateway Service terminated');
  process.exit(0);
});