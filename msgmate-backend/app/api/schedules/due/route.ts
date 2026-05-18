import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return options();
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return unauthorized();

  const schedules = await prisma.scheduledMessage.findMany({
    where: {
      userId: user.id,
      status: "DUE"
    },
    orderBy: { sendAt: "asc" },
    take: 20
  });

  return json({ schedules });
}
