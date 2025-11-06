import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { MetricsService } from '../services/MetricsService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // Skip authentication for specific routes
  const publicRoutes = [
    '/health',
    '/metrics',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/status',
    '/api/user/status',
    '/api/admin/status',
  ];

  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    MetricsService.incrementCounter('gateway_auth_failures_total', {
      reason: 'no_token',
    });
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
    };

    MetricsService.incrementCounter('gateway_auth_success_total', {
      role: req.user.role,
    });

    next();
  } catch (error) {
    MetricsService.incrementCounter('gateway_auth_failures_total', {
      reason: 'invalid_token',
    });
    res.status(401).json({ error: 'Invalid access token' });
  }
};