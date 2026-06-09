import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { generateReplies } from "@/lib/ai/groq";
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
  context: z.string().max(8000).optional()
});

export async function OPTIONS(req:NextRequest) {
  return options(req);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return unauthorized(req);

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
