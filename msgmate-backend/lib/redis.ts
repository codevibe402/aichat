import IORedis from "ioredis";
import { env } from "@/lib/env";

const globalForRedis = globalThis as unknown as {
  redis?: IORedis;
};

export const redis =
  globalForRedis.redis ??
  new IORedis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null
  });

redis.on("error", (error) => {
  if (process.env.NODE_ENV === "development") {
    console.warn("[redis]", error.message);
  }
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
