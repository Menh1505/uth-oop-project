import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { JwtClaims } from '../models/Meal';

export interface AuthRequest extends Request {
  user?: JwtClaims;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const auth = req.headers?.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing bearer token' });
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }) as JwtClaims;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};