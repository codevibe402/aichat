import { NextRequest } from "next/server";
import { json, options } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function OPTIONS(req: NextRequest) {
  return options(req);
}

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);

  if (!userId) {
    return json(req, { signedIn: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  return json(req, {
    signedIn: true,
    userId,
    email: user?.email || null,
    name: user?.name || null,
  });
}