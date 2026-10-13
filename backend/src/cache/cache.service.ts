import { getRedis, isRedisAvailable } from '../config/redis';
import { logger } from '../utils/logger';

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) return null;
    try {
      const data = await getRedis().get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      logger.warn('Cache get failed', { key, error });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
      await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.warn('Cache set failed', { key, error });
    }
  }

  async del(key: string): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
      await getRedis().del(key);
    } catch (error) {
      logger.warn('Cache del failed', { key, error });
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
      const keys = await getRedis().keys(pattern);
      if (keys.length > 0) {
        await getRedis().del(...keys);
      }
    } catch (error) {
      logger.warn('Cache delPattern failed', { pattern, error });
    }
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    if (!isRedisAvailable()) return 0;
    try {
      const count = await getRedis().incr(key);
      if (count === 1) {
        await getRedis().expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      logger.warn('Cache incr failed', { key, error });
      return 0;
    }
  }
}

export const cacheService = new CacheService();
