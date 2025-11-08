import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { jwtConfig } from '../config/config';

export interface AdminRequest extends Request {
  user?: {
    id: number;
    username: string;
    role?: string;
  };
}

export const authenticateAdmin = (req: AdminRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
  const decoded = jwt.verify(token, jwtConfig.secret as string) as any;
  req.user = decoded;

  // Check if user has admin role
  if (!req.user!.role || req.user!.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  next();

    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
