import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { json, options, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional().default("MEDIUM"),
  source: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export async function OPTIONS(req: NextRequest) {
  return options(req);
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const { searchParams } = new URL(req.url);
  const includeDone = searchParams.get("includeDone") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const where: Record<string, unknown> = { userId: user.id };
  if (!includeDone) where.isCompleted = false;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: limit,
  });

  return json(req, { tasks });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return unauthorized(req);

  const body = createSchema.parse(await req.json());

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: body.title,
      description: body.description,
      priority: body.priority,
      source: body.source,
      sourceUrl: body.sourceUrl,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  });

  return json(req, { task }, { status: 201 });
}
