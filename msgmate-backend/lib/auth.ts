import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export async function requireApiKey(req: NextRequest) {
  const apiKey = req.headers.get("x-msgmate-api-key");

  if (!apiKey || apiKey !== env.APP_API_KEY) {
    return null;
  }

  return apiKey;
}

export async function requireUser(req: NextRequest) {
  const apiKey = await requireApiKey(req);
  if (!apiKey) return null;

  const externalId = req.headers.get("x-msgmate-user-id");
  if (!externalId) return null;

  return prisma.user.upsert({
    where: { externalId },
    update: {},
    create: {
      externalId,
      settings: {
        create: {}
      }
    }
  });
}
