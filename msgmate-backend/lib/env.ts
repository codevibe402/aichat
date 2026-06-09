import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  AI_PROVIDER: z.enum(["groq"]).default("groq"),
  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().min(1),
  EXTENSION_ORIGIN: z.string().optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  AI_PROVIDER: process.env.AI_PROVIDER,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL,
  EXTENSION_ORIGIN: process.env.EXTENSION_ORIGIN
});
