import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: isDev ? error.message : 'Something went wrong'
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `AI Service endpoint not found: ${req.method} ${req.path}`
  });
};