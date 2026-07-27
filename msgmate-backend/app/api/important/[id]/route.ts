import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function OPTIONS(req: NextRequest) {
  return options(req);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.importantMessage.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return json(req, { error: "Not found" }, { status: 404 });

  const message = await prisma.importantMessage.update({
    where: { id },
    data: {
      isRead: body.isRead ?? existing.isRead,
      urgency: body.urgency ?? existing.urgency,
    },
  });

  return json(req, { message });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const { id } = await context.params;

  const existing = await prisma.importantMessage.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return json(req, { error: "Not found" }, { status: 404 });

  await prisma.importantMessage.delete({ where: { id } });
  return json(req, { success: true });
}
