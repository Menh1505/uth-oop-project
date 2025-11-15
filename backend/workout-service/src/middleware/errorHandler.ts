import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  // PostgreSQL errors
  if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  }

  if (error.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference to related resource';
    code = 'INVALID_REFERENCE';
  }

  if (error.message.includes('violates not-null constraint')) {
    statusCode = 400;
    message = 'Required field is missing';
    code = 'MISSING_REQUIRED_FIELD';
  }

  // Validation errors
  if (error.message.includes('invalid input syntax')) {
    statusCode = 400;
    message = 'Invalid data format';
    code = 'INVALID_FORMAT';
  }

  const errorResponse: any = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = error.details;
  }

  console.error('Error occurred:', {
    ...errorResponse,
    stack: error.stack
  });

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};