import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || '6379'}`;

const redisClient = createClient({ url: redisUrl });

let connectPromise: Promise<void> | null = null;

redisClient.on('error', (error) => {
  console.error('[Auth][Redis] connection error:', error.message);
});

redisClient.on('ready', () => {
  console.log('[Auth][Redis] ready and accepting commands');
});

redisClient.on('reconnecting', () => {
  console.log('[Auth][Redis] attempting to reconnect...');
});

export async function ensureRedisConnection() {
  if (redisClient.isOpen) return;
  if (!connectPromise) {
    connectPromise = redisClient.connect().then(() => {}).catch((error) => {
      connectPromise = null;
      console.error('[Auth][Redis] failed to connect:', error.message);
      throw error;
    });
  }
  try {
    await connectPromise;
  } catch (error) {
    // Swallow to keep auth service functional even if Redis is down
  }
}

export default redisClient;
