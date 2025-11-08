import rateLimit from 'express-rate-limit';
import { config } from '../config/config';
import { MetricsService } from '../services/MetricsService';

export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    MetricsService.incrementCounter('gateway_rate_limit_exceeded_total', {
      ip: req.ip || 'unknown',
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks and metrics
    const skipRoutes = ['/health', '/metrics'];
    return skipRoutes.some(route => req.path.startsWith(route));
  },
});