import Redis from 'ioredis';
import { REDIS_URL } from '@/config';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    if (REDIS_URL) {
      redisClient = new Redis(REDIS_URL);
    } else {
      // Fallback to in-memory Map for development without Redis
      console.warn('Redis not configured, using in-memory cache');
      redisClient = createInMemoryRedis() as any;
    }
  }
  return redisClient;
}

// Create a mock Redis client using Map for development
function createInMemoryRedis() {
  const store = new Map<string, string>();
  
  return {
    async get(key: string) {
      return store.get(key) || null;
    },
    async set(key: string, value: string, ...args: any[]) {
      store.set(key, value);
      
      // Handle EXPIRE
      if (args.includes('EX') && args.length > 1) {
        const expireIndex = args.indexOf('EX');
        const seconds = parseInt(args[expireIndex + 1]);
        setTimeout(() => {
          store.delete(key);
        }, seconds * 1000);
      }
      
      return 'OK';
    },
    async del(key: string) {
      return store.delete(key) ? 1 : 0;
    },
    async exists(key: string) {
      return store.has(key) ? 1 : 0;
    },
    disconnect() {
      store.clear();
    },
  };
}
