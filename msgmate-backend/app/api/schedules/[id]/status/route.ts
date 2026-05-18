import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum([
    "SENDING",
    "SENT",
    "FAILED",
    "NEEDS_USER_LOGIN",
    "PLATFORM_NOT_OPEN",
    "SELECTOR_FAILED"
  ]),
  error: z.string().max(1000).optional()
});

export async function OPTIONS() {
  return options();
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return unauthorized();

  const { id } = await context.params;
  const body = statusSchema.parse(await req.json());

  const schedule = await prisma.scheduledMessage.findFirst({
    where: {
      id,
      userId: user.id
    }
  });

  if (!schedule) {
    return json({ error: "Schedule not found" }, { status: 404 });
  }

  const updated = await prisma.scheduledMessage.update({
    where: { id },
    data: {
      status: body.status,
      lastError: body.error,
      deliveredAt: body.status === "SENT" ? new Date() : undefined
    }
  });

  return json({ schedule: updated });
}
