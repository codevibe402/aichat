import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { generateReplies } from "@/lib/ai/groq";

const bodySchema = z.object({
  platform: z.string().optional(),
  tone: z.string().min(1).default("friendly"),
  context: z.string().max(8000).optional()
});

export async function OPTIONS() {
  return options();
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return unauthorized();

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

    return json({ replies: result.replies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate replies";
    console.error("[api/ai/replies]", error);
    return json({ error: message }, { status: 502 });
  }
}
