import { prisma } from "./prisma"
import { getSessionUserId } from "./session"

// ── Public API: Called by API route handlers ──────────────────────────────────

/** Extracts and verifies the authenticated user from the request. Returns null if unauthenticated. */
export async function requireUser(req: Request) {
  const userId = await getSessionUserId(req)
  if (!userId) return null
  return prisma.user.findUnique({ where: { id: userId } })
}

/** Creates or updates a user record. Used during Google OAuth callback. */
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
