import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cancelQueuedSchedule, enqueueSchedule } from "@/lib/queues/schedules";

const updateSchema = z.object({
  platform: z.string().min(1).optional(),
  text: z.string().min(1).max(10000).optional(),
  targetUrl: z.string().url().nullable().optional(),
  sendAt: z.string().datetime().optional()
});

export async function OPTIONS(req: NextRequest) {
  return options(req);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const { id } = await context.params;
  const body = updateSchema.parse(await req.json());

  const existing = await prisma.scheduledMessage.findFirst({
    where: {
      id,
      userId: user.id
    }
  });

  if (!existing) {
    return json(req, { error: "Schedule not found" }, { status: 404 });
  }

  if (existing.status !== "PENDING") {
    return json(req, { error: "Only pending schedules can be edited" }, { status: 400 });
  }

  const sendAt = body.sendAt ? new Date(body.sendAt) : existing.sendAt;
  if (sendAt.getTime() <= Date.now()) {
    return json(req, { error: "sendAt must be in the future" }, { status: 400 });
  }

  const schedule = await prisma.scheduledMessage.update({
    where: { id },
    data: {
      platform: body.platform,
      text: body.text,
      targetUrl: body.targetUrl,
      sendAt
    }
  });

  await cancelQueuedSchedule(id);
  await enqueueSchedule(id, sendAt);

  return json(req, { schedule });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const { id } = await context.params;
  const existing = await prisma.scheduledMessage.findFirst({
    where: {
      id,
      userId: user.id
    }
  });

  if (!existing) {
    return json(req, { error: "Schedule not found" }, { status: 404 });
  }

  await cancelQueuedSchedule(id);

  const schedule = await prisma.scheduledMessage.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date()
    }
  });

  return json(req, { schedule });
}
