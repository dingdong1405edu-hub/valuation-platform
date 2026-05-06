import IORedis from "ioredis";
import { setSearchCache, setFetchCache } from "@vp/ai";

let redisClient: IORedis | null = null;

export function getRedis(): IORedis | null {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  redisClient = new IORedis(url, { maxRetriesPerRequest: 3 });
  return redisClient;
}

export function installRedisCaches(): void {
  const redis = getRedis();
  if (!redis) return;
  const cache = {
    async get(key: string) {
      return redis.get(key);
    },
    async set(key: string, value: string, ttlSeconds: number) {
      await redis.set(key, value, "EX", ttlSeconds);
    },
  };
  setSearchCache(cache);
  setFetchCache(cache);
}
