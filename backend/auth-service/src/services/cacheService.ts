import redisClient, { ensureRedisConnection } from '../config/redis';
import type { AuthUserRecord, CachedAuthUserPayload } from '../types/auth';

const USER_CACHE_PREFIX = 'auth:user:';
const USER_CACHE_TTL = parseInt(process.env.AUTH_USER_CACHE_TTL || '600', 10);

function normalizeIdentifier(identifier?: string) {
  return (identifier || '').trim().toLowerCase();
}

function buildKey(identifier: string) {
  return `${USER_CACHE_PREFIX}${identifier}`;
}

export async function getCachedAuthUser(identifier?: string): Promise<CachedAuthUserPayload | null> {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return null;

  try {
    await ensureRedisConnection();
    if (!redisClient.isOpen) return null;
    const raw = await redisClient.get(buildKey(normalized));
    if (!raw) return null;
    return JSON.parse(raw) as CachedAuthUserPayload;
  } catch (error) {
    console.warn(`[Auth][Cache] Failed to read user ${normalized}:`, (error as Error).message);
    return null;
  }
}

export async function cacheAuthUser(identifier: string, payload: CachedAuthUserPayload): Promise<void> {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return;

  try {
    await ensureRedisConnection();
    if (!redisClient.isOpen) return;
    await redisClient.set(buildKey(normalized), JSON.stringify(payload), {
      EX: USER_CACHE_TTL,
    });
    console.log(`[Auth][Cache] Stored user ${normalized} for ${USER_CACHE_TTL}s`);
  } catch (error) {
    console.warn(`[Auth][Cache] Failed to store user ${normalized}:`, (error as Error).message);
  }
}

export async function invalidateAuthUserCache(identifier: string): Promise<void> {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return;
  try {
    await ensureRedisConnection();
    if (!redisClient.isOpen) return;
    await redisClient.del(buildKey(normalized));
    console.log(`[Auth][Cache] Invalidated user cache ${normalized}`);
  } catch (error) {
    console.warn(`[Auth][Cache] Failed to invalidate user ${normalized}:`, (error as Error).message);
  }
}
