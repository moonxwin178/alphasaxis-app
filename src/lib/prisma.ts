import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Lazily-constructed singleton, cached on globalThis in dev to survive HMR
 * without exhausting Neon connections. Mirrors the lazy-init pattern used by
 * getKv() in the marketing site, but throws at call time (not import time)
 * only when DATABASE_URL is genuinely missing.
 */
export function getPrisma(): PrismaClient {
  if (global.__prisma) return global.__prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Database is not configured: missing DATABASE_URL env var.");
  }

  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    global.__prisma = client;
  }

  return client;
}
