import { randomUUID } from "crypto";
import { redis } from "./redis";

type CheckRateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type CheckRateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: CheckRateLimitOptions): Promise<CheckRateLimitResult> {
  try {
    const now = Date.now();
    const windowStart = now - windowMs;
    const member = randomUUID();

    const results = await redis
      .multi()
      .zremrangebyscore(key, 0, windowStart)
      .zadd(key, now, member)
      .zcard(key)
      .expire(key, Math.ceil(windowMs / 1000))
      .exec();

    const count = Number(results?.[2]?.[1] ?? 0);

    const remaining = Math.max(0, limit - count);

    const oldestEntry = await redis.zrange(
      key,
      0,
      0,
      "WITHSCORES"
    );

    let reset = now + windowMs;

    if (oldestEntry.length >= 2) {
      const oldestTimestamp = Number(oldestEntry[1]);
      reset = oldestTimestamp + windowMs;
    }

    return {
      success: count <= limit,
      remaining: count <= limit ? remaining : 0,
      reset,
    };
  } catch (error) {
    console.error("[ratelimit]", error);

    // Fallback if Redis is unavailable
    return {
      success: true,
      remaining: Infinity,
      reset: Date.now(),
    };
  }
}