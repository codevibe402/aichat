import { NextRequest } from "next/server";
import { z } from "zod";
import { json, options, unauthorized } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectImportant } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/ratelimit";
import { env } from "@/lib/env";

const bodySchema = z.object({
  platform: z.string().min(1),
  messages: z.array(z.object({
    sender: z.enum(["me", "them"]),
    text: z.string().min(1).max(4000),
  })).min(1).max(50),
});

export async function OPTIONS(req: NextRequest) {
  return options(req);
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const check = await checkRateLimit({
    key: `ratelimit:detect-important:${user.id}`,
    limit: parseInt(env.RATE_LIMIT_SUMMARY),
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  });

  if (!check.success) {
    return json(req, { error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = bodySchema.parse(await req.json());
    const result = await detectImportant(body);

    const saved = [];
    for (const msg of result.messages) {
      const existing = await prisma.importantMessage.findFirst({
        where: {
          userId: user.id,
          preview: msg.text.slice(0, 200),
          detectedAt: { gte: new Date(Date.now() - 86400000) },
        },
      });
      if (existing) continue;

      const savedMsg = await prisma.importantMessage.create({
        data: {
          userId: user.id,
          platform: body.platform,
          senderName: msg.senderName || "Unknown",
          subject: msg.reason || null,
          preview: msg.text.slice(0, 5000),
          urgency: (msg.urgency as "URGENT" | "HIGH" | "MEDIUM" | "LOW") || "MEDIUM",
        },
      });
      saved.push(savedMsg);
    }

    return json(req, {
      messages: saved,
      count: saved.length,
      usage: result.usage,
    });
  } catch (error) {
    console.error("[api/ai/detect-important]", error);
    return json(req, { error: "Could not detect important messages" }, { status: 502 });
  }
}