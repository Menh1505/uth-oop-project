import { Request, Response, NextFunction } from 'express';
import { getCachedAuthUser } from '../services/cacheService';

function extractIdentifier(req: Request): string | null {
  const { email, username } = req.body || {};
  const identifier = (email || username || '').trim().toLowerCase();
  return identifier || null;
}

export async function userCacheMiddleware(req: Request, _res: Response, next: NextFunction) {
  const identifier = extractIdentifier(req);
  if (!identifier) {
    req.cachedAuthPayload = null;
    return next();
  }

  req.userCacheKey = identifier;

  try {
    const cachedPayload = await getCachedAuthUser(identifier);
    req.cachedAuthPayload = cachedPayload;

    const status = cachedPayload ? 'HIT' : 'MISS';
    console.log(`[Auth][Cache] ${status} login cache for user=${identifier}`);
  } catch (error) {
    req.cachedAuthPayload = null;
    console.warn(`[Auth][Cache] middleware error for user=${identifier}:`, (error as Error).message);
  }

  next();
}
