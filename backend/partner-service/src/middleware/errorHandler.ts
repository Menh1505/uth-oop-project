import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', error);

  // Default error
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden access';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.message) {
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// Validation middleware for request body
export const validateRequest = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter(field => 
      req.body[field] === undefined || req.body[field] === null || req.body[field] === ''
    );

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields,
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};