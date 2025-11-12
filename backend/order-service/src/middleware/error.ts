import { NextFunction, Request, Response } from 'express';
import logger from '../config/logger.js';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ err }, 'Unhandled error');
  const code = err.statusCode ?? 500;
  res.status(code).json({ error: err.message ?? 'Internal Server Error' });
}
