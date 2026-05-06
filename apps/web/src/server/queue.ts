import { Queue } from "bullmq";
import IORedis from "ioredis";

export const QUEUE_NAME = "valuation-jobs";

let cachedQueue: Queue | null = null;

export function getQueue(): Queue {
  if (cachedQueue) return cachedQueue;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL required");
  const connection = new IORedis(url, { maxRetriesPerRequest: null });
  cachedQueue = new Queue(QUEUE_NAME, { connection });
  return cachedQueue;
}
