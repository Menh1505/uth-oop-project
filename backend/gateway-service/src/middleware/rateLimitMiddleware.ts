import type { Request, Response, NextFunction } from "express";
import { rateLimit, type RateLimitRequestHandler, type Options } from "express-rate-limit";
import { config } from "../config/config";
import { MetricsService } from "../services/MetricsService";

export const rateLimitMiddleware: RateLimitRequestHandler = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.maxRequests,
  message: {
    error: "Too many requests",
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction, options: Options) => {
    // Log rate limit exceeded
    try {
      MetricsService.incrementCounter("gateway_rate_limit_exceeded_total", {
        ip: req.ip || "unknown",
      });
    } catch (error) {
      console.error('Failed to record rate limit metric:', error);
    }

    // Return rate limit response
    res.status(options.statusCode ?? 429).send(options.message);
  },

  // Bỏ qua một số route
  skip: (req) => {
    const skipRoutes = ["/health", "/metrics"];
    return skipRoutes.some((route) => req.path?.startsWith(route));
  },
});
