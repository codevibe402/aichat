import { PrismaClient } from "@prisma/client";

// ── Private: Prisma singleton ────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// ── Public API: Prisma client ───────────────────────────────────────────────

/** @internal Shared Prisma client for PostgreSQL access. Server-only — must never be imported by extension code. */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
