import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  platform: z.string().min(1),
  senderName: z.string().min(1),
  senderEmail: z.string().email().optional().nullable(),
  subject: z.string().optional().nullable(),
  preview: z.string().min(1).max(5000),
  url: z.string().url().optional().nullable(),
  urgency: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).optional().default("MEDIUM"),
});

export async function OPTIONS(req: NextRequest) {
  return options(req);
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const { searchParams } = new URL(req.url);
  const includeRead = searchParams.get("includeRead") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const where: Record<string, unknown> = { userId: user.id };
  if (!includeRead) where.isRead = false;

  const messages = await prisma.importantMessage.findMany({
    where,
    orderBy: [{ urgency: "asc" }, { detectedAt: "desc" }],
    take: limit,
  });

  return json(req, { messages });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const body = createSchema.parse(await req.json());

  const message = await prisma.importantMessage.create({
    data: {
      userId: user.id,
      platform: body.platform,
      senderName: body.senderName,
      senderEmail: body.senderEmail,
      subject: body.subject,
      preview: body.preview,
      url: body.url,
      urgency: body.urgency,
    },
  });

  return json(req, { message }, { status: 201 });
}
