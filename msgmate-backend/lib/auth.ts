import { prisma } from "./prisma"
import { getSessionUserId } from "./session"

export async function requireUser(req: Request) {
  const userId = await getSessionUserId(req)
  if (!userId) return null
  return prisma.user.findUnique({ where: { id: userId } })
}

export async function registerUser({
  externalId,
  email,
  name
}: {
  externalId: string;
  email?: string | null;
  name?: string | null;
}) {
  return prisma.user.upsert({
    where: { externalId },
    update: { email: email ?? undefined, name: name ?? undefined },
    create: { externalId, email: email ?? undefined, name: name ?? undefined, settings: { create: {} } }
  });
}
