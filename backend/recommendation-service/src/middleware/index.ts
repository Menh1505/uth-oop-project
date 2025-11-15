import { Request, Response, NextFunction } from 'express';

// Error handling middleware
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

// Validation middleware for user data
export function validateUserData(req: Request, res: Response, next: NextFunction) {
  const { body } = req;
  
  if (req.method === 'POST' && req.path === '/users') {
    const required = ['name', 'email', 'age', 'gender', 'height', 'weight', 'activityLevel'];
    const missing = required.filter(field => !body[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Validate numeric fields
    if (body.age < 13 || body.age > 120) {
      return res.status(400).json({
        success: false,
        message: 'Age must be between 13 and 120'
      });
    }
    
    if (body.height < 100 || body.height > 250) {
      return res.status(400).json({
        success: false,
        message: 'Height must be between 100 and 250 cm'
      });
    }
    
    if (body.weight < 30 || body.weight > 300) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be between 30 and 300 kg'
      });
    }
  }
  
  next();
}

// Rate limiting middleware (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
  
  let requestInfo = requestCounts.get(ip);
  
  if (!requestInfo || now > requestInfo.resetTime) {
    requestInfo = { count: 1, resetTime: now + windowMs };
    requestCounts.set(ip, requestInfo);
  } else {
    requestInfo.count++;
  }
  
  if (requestInfo.count > maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((requestInfo.resetTime - now) / 1000)
    });
  }
  
  next();
}

export default {
  errorHandler,
  requestLogger,
  validateUserData,
  rateLimiter
};