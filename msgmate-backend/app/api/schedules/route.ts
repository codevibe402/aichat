import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { enqueueSchedule } from "@/lib/queues/schedules";

const createSchema = z.object({
  platform: z.string().min(1),
  text: z.string().min(1).max(10000),
  targetUrl: z.string().url().optional(),
  sendAt: z.string().datetime()
});

export async function OPTIONS(req: NextRequest) {
  return options(req);
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const schedules = await prisma.scheduledMessage.findMany({
    where: { userId: user.id },
    orderBy: { sendAt: "desc" },
    take: 100
  });

  return json(req, { schedules });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const body = createSchema.parse(await req.json());
  const sendAt = new Date(body.sendAt);

  if (sendAt.getTime() <= Date.now()) {
    return json(req, { error: "sendAt must be in the future" }, { status: 400 });
  }

  const schedule = await prisma.scheduledMessage.create({
    data: {
      userId: user.id,
      platform: body.platform,
      text: body.text,
      targetUrl: body.targetUrl,
      sendAt
    }
  });

  await enqueueSchedule(schedule.id, sendAt);

  return json(req, { schedule }, { status: 201 });
}
