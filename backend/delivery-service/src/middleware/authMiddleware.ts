import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
  };
  driver?: {
    id: string;
    driver_id: string;
  };
}

interface JWTPayload {
  id: string;
  role: string;
  email?: string;
  driver_id?: string;
}

/**
 * General authentication middleware
 * Validates JWT token and adds user info to request
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required',
      error: 'UNAUTHORIZED'
    });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
    
    // If user is a driver, add driver info
    if (decoded.driver_id) {
      req.driver = {
        id: decoded.id,
        driver_id: decoded.driver_id
      };
    }
    
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: 'FORBIDDEN'
    });
    return;
  }
};

/**
 * Admin-only middleware
 * Requires admin role
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      error: 'INSUFFICIENT_PERMISSIONS'
    });
    return;
  }

  next();
};

/**
 * Driver-only middleware
 * Requires driver role
 */
export const requireDriver = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
    return;
  }

  if (req.user.role !== 'driver') {
    res.status(403).json({
      success: false,
      message: 'Driver access required',
      error: 'INSUFFICIENT_PERMISSIONS'
    });
    return;
  }

  if (!req.driver) {
    res.status(403).json({
      success: false,
      message: 'Driver profile required',
      error: 'DRIVER_PROFILE_MISSING'
    });
    return;
  }

  next();
};

/**
 * Partner-only middleware
 * Requires partner role
 */
export const requirePartner = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
    return;
  }

  if (req.user.role !== 'partner') {
    res.status(403).json({
      success: false,
      message: 'Partner access required',
      error: 'INSUFFICIENT_PERMISSIONS'
    });
    return;
  }

  next();
};

/**
 * Customer or admin middleware
 * Allows customer or admin access
 */
export const requireCustomerOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
    return;
  }

  if (req.user.role !== 'customer' && req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Customer or admin access required',
      error: 'INSUFFICIENT_PERMISSIONS'
    });
    return;
  }

  next();
};

/**
 * Multi-role middleware
 * Allows multiple roles
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
};

/**
 * Self-access middleware for drivers
 * Ensures driver can only access their own data
 */
export const requireSelfOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
    return;
  }

  // Admin can access any data
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Driver can only access their own data
  if (req.user.role === 'driver') {
    const requestedDriverId = req.params.id || req.params.driverId;
    
    if (!req.driver || req.driver.driver_id !== requestedDriverId) {
      res.status(403).json({
        success: false,
        message: 'Can only access own data',
        error: 'FORBIDDEN_ACCESS'
      });
      return;
    }
  }

  // Customer can access their own deliveries
  if (req.user.role === 'customer') {
    // Additional validation can be added here for customer-specific access
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message: 'Access denied',
    error: 'INSUFFICIENT_PERMISSIONS'
  });
};

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't require it
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
    
    if (decoded.driver_id) {
      req.driver = {
        id: decoded.id,
        driver_id: decoded.driver_id
      };
    }
  } catch (error) {
    // Token is invalid, but we don't reject the request
    console.log('Invalid token in optional auth:', error);
  }

  next();
};

/**
 * Rate limiting middleware for API endpoints
 */
export const rateLimitByRole = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Basic rate limiting logic - in production, use proper rate limiting library
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  if (!req.user) {
    // Anonymous users: 10 requests per minute
    next();
    return;
  }

  // Different limits based on role
  const limits = {
    admin: 1000,     // 1000 requests per minute
    partner: 500,    // 500 requests per minute
    driver: 200,     // 200 requests per minute
    customer: 100    // 100 requests per minute
  };

  const userLimit = limits[req.user.role as keyof typeof limits] || 50;
  
  // In a real implementation, you'd use Redis or similar to track request counts
  // For now, we'll just log and continue
  console.log(`Rate limit check - User: ${req.user.id}, Role: ${req.user.role}, Limit: ${userLimit}`);
  
  next();
};

/**
 * Delivery ownership middleware
 * Ensures user can only access deliveries they're involved with
 */
export const checkDeliveryAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
    return;
  }

  // Admin can access all deliveries
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // For other roles, we'll need to check delivery ownership in the controller
  // This middleware just ensures authentication
  next();
};

/**
 * WebSocket authentication middleware
 */
export const authenticateWebSocket = (token: string): JWTPayload | null => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

// Export types for use in other files
export type { AuthRequest, JWTPayload };