import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  AI_PROVIDER: z.enum(["groq"]).default("groq"),
  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().min(1),
  EXTENSION_ORIGIN: z.string().optional(),
  RATE_LIMIT_REPLIES: z.string().default("20"),
  RATE_LIMIT_SUMMARY: z.string().default("10"),
  RATE_LIMIT_WINDOW_MS: z.string().default("60000")
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  AI_PROVIDER: process.env.AI_PROVIDER,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL,
  EXTENSION_ORIGIN: process.env.EXTENSION_ORIGIN,
  RATE_LIMIT_REPLIES: process.env.RATE_LIMIT_REPLIES,
  RATE_LIMIT_SUMMARY: process.env.RATE_LIMIT_SUMMARY,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS
});
