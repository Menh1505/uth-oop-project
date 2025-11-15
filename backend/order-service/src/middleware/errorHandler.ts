import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }
  
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Database constraint errors
  if (error.message.includes('duplicate key value')) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Order-specific errors
  if (error.message.includes('Invalid status transition')) {
    statusCode = 400;
    message = error.message;
  }

  if (error.message.includes('Only pending or cancelled orders can be deleted')) {
    statusCode = 400;
    message = error.message;
  }

  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    statusCode,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message
    })
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    path: req.path
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};