import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { aiConfig } from '../config/config.js';
import logger from '../config/logger.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, aiConfig.jwtSecret) as any;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      
      next();
    } catch (jwtError) {
      logger.error('JWT verification failed', { error: jwtError });
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error', { error });
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};