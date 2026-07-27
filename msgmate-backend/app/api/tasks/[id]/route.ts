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

  const existing = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return json(req, { error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.source !== undefined) updateData.source = body.source;
  if (body.sourceUrl !== undefined) updateData.sourceUrl = body.sourceUrl;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (body.isCompleted !== undefined) {
    updateData.isCompleted = body.isCompleted;
    updateData.completedAt = body.isCompleted ? new Date() : null;
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
  });

  return json(req, { task });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const { id } = await context.params;

  const existing = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return json(req, { error: "Not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return json(req, { success: true });
}
