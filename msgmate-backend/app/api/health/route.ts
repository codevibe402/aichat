import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { json, options } from "@/lib/http";

export async function OPTIONS(req:NextRequest) {
  return options(req);
}

export async function GET(req: NextRequest) {
  const [db, cache] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    pingRedis()
  ]);

  return json(req, {
    ok: db.status === "fulfilled" && cache.status === "fulfilled",
    database: db.status === "fulfilled" ? "ok" : "error",
    redis: cache.status === "fulfilled" ? "ok" : "error"
  });
}

async function pingRedis() {
  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  }

  return redis.ping();
}
