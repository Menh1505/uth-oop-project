import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing bearer token' });
    const token = auth.slice(7);

    // check blacklist: so sánh hash
    const rows = (await pool.query('SELECT token_hash, expires_at FROM token_blacklist WHERE expires_at > NOW()')).rows;
    for (const r of rows) {
      if (await bcrypt.compare(token, r.token_hash)) {
        return res.status(401).json({ message: 'Token revoked' });
      }
    }

    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }) as any;

    (req as any).user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
    