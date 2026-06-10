import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { summarizeChat } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/ratelimit";
import { env } from "@/lib/env";

const bodySchema = z.object({
  conversation: z.string().min(1).max(20000)
});

export async function OPTIONS(req:NextRequest) {
  return options(req);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return unauthorized(req);

    const check = await checkRateLimit({
      key: `ratelimit:summary:${user.id}`,
      limit: parseInt(env.RATE_LIMIT_SUMMARY),
      windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
    });

    if (!check.success) {
      return json(
        req,
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = bodySchema.parse(await req.json());
    const result = await summarizeChat(body);

    await prisma.aiRequest.create({
      data: {
        userId: user.id,
        type: "SUMMARY",
        inputTokens: result.usage?.input_tokens,
        outputTokens: result.usage?.output_tokens
      }
    });

    return json(req,{ summary: result.summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not summarize chat";
    console.error("[api/ai/summary]", error);
    return json(req,{ error: message }, { status: 502 });
  }
}
