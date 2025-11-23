import type { CachedAuthUserPayload } from './auth';

declare global {
  namespace Express {
    interface Request {
      cachedAuthPayload?: CachedAuthUserPayload | null;
      userCacheKey?: string;
    }
  }
}

export {};
