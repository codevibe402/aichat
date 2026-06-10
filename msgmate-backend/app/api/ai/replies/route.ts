import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { generateReplies } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/ratelimit";
import { env } from "@/lib/env";
import {
  AIError,
  EmptyResponseError,
  GroqRequestError,
  GroqRateLimitError,
  GroqUnauthorizedError,
  InvalidJsonError,
  InvalidReplyCountError,
} from "@/lib/ai/aierror";
const bodySchema = z.object({
  platform: z.string().optional(),
  tone: z.string().min(1).default("friendly"),
  userGoall:z.string().max(500).optional(),
  messages: z
    .array(
      z.object({
        sender: z.enum(["me", "them"]),
        text: z.string().min(1).max(4000),
      }),
    )
    .min(1),
});

export async function OPTIONS(req:NextRequest) {
  return options(req);
}

export async function POST(req: NextRequest) {


  try {
    const user = await requireUser(req);
    if (!user) return unauthorized(req);
    const check = await checkRateLimit({
      key: `ratelimit:replies:${user.id}`,
      limit: parseInt(env.RATE_LIMIT_REPLIES),
      windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
    });

    if(!check.success){
       return Response.json(
    { error: "Too many requests" },
    { status: 429 }
  );
    }
    const body = bodySchema.parse(await req.json());
    const result = await generateReplies(body);

    await prisma.aiRequest.create({
      data: {
        userId: user.id,
        type: "REPLY",
        platform: body.platform,
        tone: body.tone,
        inputTokens: result.usage?.input_tokens,
        outputTokens: result.usage?.output_tokens
      }
    });
     
   return json(req,{
    replies:result.replies
   } ); 
  } catch (error) {
  console.error("[api/ai/replies]", error);

  if (error instanceof AIError) {
    return json(
      req,
      { error: error.message },
      { status: error.statusCode }
    );
  }

  return json(
    req,
    { error: "Internal Server Error" },
    { status: 500 }
  );
}
}
