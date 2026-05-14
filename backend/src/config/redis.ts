import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 5) {
      logger.error('Redis: max retries reached, giving up');
      return null;
    }
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err));
redis.on('close', () => logger.warn('Redis connection closed'));
redis.on('reconnecting', () => logger.info('Redis reconnecting...'));

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    // Non-fatal in dev, fatal in prod
    if (env.NODE_ENV === 'production') throw error;
  }
};

// Cache helpers with typed generics
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const value = await redis.incr(key);
    if (ttlSeconds && value === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return value;
  },
};

export const CACHE_KEYS = {
  userProfile: (userId: string) => `user:profile:${userId}`,
  userSubjects: (userId: string) => `user:subjects:${userId}`,
  userStats: (userId: string) => `user:stats:${userId}`,
  tokenBlacklist: (jti: string) => `token:blacklist:${jti}`,
  resetToken: (token: string) => `reset:${token}`,
  emailVerify: (token: string) => `verify:${token}`,
};
