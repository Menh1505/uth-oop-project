import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  details?: any;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

/**
 * Main error handling middleware
 * Handles all types of errors and formats them consistently
 */
export const errorHandler = (
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle different types of errors
  if (error.status || error.statusCode) {
    statusCode = error.status || error.statusCode || 500;
  }

  // Database errors
  if (error.code === '23505') {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
    details = {
      constraint: error.message.match(/constraint "([^"]*)"/) ? 
        error.message.match(/constraint "([^"]*)"/)![1] : undefined
    };
  }

  if (error.code === '23503') {
    statusCode = 400;
    errorCode = 'FOREIGN_KEY_VIOLATION';
    message = 'Referenced resource does not exist';
  }

  if (error.code === '23502') {
    statusCode = 400;
    errorCode = 'NOT_NULL_VIOLATION';
    message = 'Required field is missing';
  }

  if (error.code === '22P02') {
    statusCode = 400;
    errorCode = 'INVALID_INPUT_SYNTAX';
    message = 'Invalid data format';
  }

  // Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    statusCode = 503;
    errorCode = 'SERVICE_UNAVAILABLE';
    message = 'Service temporarily unavailable';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Request validation failed';
  }

  // Custom application errors
  if (error.message.includes('not found')) {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = error.message;
  }

  if (error.message.includes('unauthorized') || error.message.includes('access denied')) {
    statusCode = 403;	
    errorCode = 'FORBIDDEN';
    message = error.message;
  }

  if (error.message.includes('already exists')) {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = error.message;
  }

  // Rate limiting errors
  if (error.message.includes('rate limit')) {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    message = 'Too many requests, please try again later';
  }

  // Payment errors
  if (error.message.includes('payment') || error.message.includes('transaction')) {
    statusCode = 402;
    errorCode = 'PAYMENT_ERROR';
    message = error.message;
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    error: errorCode,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  // Add details for development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = details || {
      originalMessage: error.message,
      code: error.code
    };
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Route ${req.method} ${req.url} not found`) as ErrorWithStatus;
  error.status = 404;
  next(error);
};

/**
 * Validation error handler
 * Creates standardized validation errors
 */
export const createValidationError = (
  field: string, 
  message: string, 
  value?: any
): Error => {
  const error = new Error(`Validation failed for field '${field}': ${message}`) as ErrorWithStatus;
  error.name = 'ValidationError';
  error.status = 400;
  return error;
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  public status: number;
  public errorCode: string;
  public details?: any;

  constructor(
    message: string,
    status: number = 500,
    errorCode: string = 'APPLICATION_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database error handler
 * Specific handler for database-related errors
 */
export const handleDatabaseError = (error: any): AppError => {
  console.error('Database error:', error);

  if (error.code === '23505') {
    return new AppError(
      'Resource already exists',
      409,
      'DUPLICATE_ENTRY',
      { constraint: error.constraint }
    );
  }

  if (error.code === '23503') {
    return new AppError(
      'Referenced resource does not exist',
      400,
      'FOREIGN_KEY_VIOLATION',
      { constraint: error.constraint }
    );
  }

  if (error.code === '23502') {
    return new AppError(
      'Required field is missing',
      400,
      'NOT_NULL_VIOLATION',
      { column: error.column }
    );
  }

  if (error.code === 'ECONNREFUSED') {
    return new AppError(
      'Database connection failed',
      503,
      'DATABASE_CONNECTION_ERROR'
    );
  }

  return new AppError(
    'Database operation failed',
    500,
    'DATABASE_ERROR',
    { originalError: error.message }
  );
};

/**
 * Request validation middleware
 * Validates request data against schema
 */
export const validateRequest = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = [];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        errors.push({
          field,
          message: 'This field is required',
          value: req.body[field]
        });
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Request validation failed',
        error: 'VALIDATION_ERROR',
        details: { errors },
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method
      });
      return;
    }

    next();
  };
};

/**
 * Coordinate validation middleware
 * Validates latitude and longitude values
 */
export const validateCoordinates = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { latitude, longitude } = req.body;

  if (latitude !== undefined) {
    const lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      res.status(400).json({
        success: false,
        message: 'Invalid latitude value. Must be between -90 and 90',
        error: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method
      });
      return;
    }
  }

  if (longitude !== undefined) {
    const lng = parseFloat(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        message: 'Invalid longitude value. Must be between -180 and 180',
        error: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method
      });
      return;
    }
  }

  next();
};

/**
 * Request timeout middleware
 * Handles request timeouts
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
          error: 'REQUEST_TIMEOUT',
          timestamp: new Date().toISOString(),
          path: req.url,
          method: req.method
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};