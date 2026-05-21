import { getRedisClient } from './redis';
import { AIReview } from '@/types';

const CACHE_PREFIX = 'ai_review:';
const DEFAULT_TTL = 60 * 60 * 24; // 24 hours in seconds

export interface CacheKey {
  code: string;
  language: string;
}

export function generateCacheKey(key: CacheKey): string {
  const hash = require('crypto').createHash('md5');
  hash.update(`${key.language}:${key.code}`);
  return `${CACHE_PREFIX}${hash.digest('hex')}`;
}

export async function getCachedReview(key: CacheKey): Promise<AIReview | null> {
  try {
    const redis = getRedisClient();
    const cacheKey = generateCacheKey(key);
    
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log('✅ Cache hit for AI review');
      return JSON.parse(cached);
    }
    
    console.log('❌ Cache miss for AI review');
    return null;
  } catch (error) {
    console.error('Error getting cached review:', error);
    return null;
  }
}

export async function cacheReview(
  key: CacheKey,
  review: AIReview,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    const redis = getRedisClient();
    const cacheKey = generateCacheKey(key);
    
    await redis.set(cacheKey, JSON.stringify(review), 'EX', ttl);
    console.log('✅ Cached AI review');
  } catch (error) {
    console.error('Error caching review:', error);
  }
}

export async function invalidateCache(key: CacheKey): Promise<void> {
  try {
    const redis = getRedisClient();
    const cacheKey = generateCacheKey(key);
    await redis.del(cacheKey);
    console.log('🗑️ Invalidated cache');
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}
