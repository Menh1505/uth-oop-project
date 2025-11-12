import { NextFunction, Request, Response } from 'express';
import { config } from '../config/index.js';

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.header(config.auth.userIdHeader);
  if (!userId) return res.status(401).json({ error: 'Missing user identity' });
  (req as any).userId = Number(userId); // hoặc giữ string nếu ID là UUID
  next();
}
