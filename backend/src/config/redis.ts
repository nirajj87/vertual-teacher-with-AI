import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  try {
    await client.connect();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', { error });
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis disconnected');
  }
}

export function isRedisAvailable(): boolean {
  return redis?.status === 'ready';
}
