import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { TokenBlacklist } from '../models/User';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing bearer token' });
    const token = auth.slice(7);

    // Check blacklist với MongoDB
    const blacklistedTokens = await TokenBlacklist.find({ 
      expires_at: { $gt: new Date() } 
    }).select('token_hash').lean();
    
    for (const blacklisted of blacklistedTokens) {
      if (await bcrypt.compare(token, blacklisted.token_hash)) {
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
    