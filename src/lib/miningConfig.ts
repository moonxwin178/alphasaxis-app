import "server-only";
import { getPrisma } from "./prisma";

/**
 * Lazily-seeded config row for the two genuinely volatile, external numbers:
 * the government petrol subsidy rate (changes by policy announcement — we
 * could not verify Malaysia's current live rate, so this must stay
 * admin-editable, never hardcoded) and the RM/USD FX rate used to convert
 * deposit values into $AXIS at the pool's $0.0005 anchor.
 */
export async function getMiningConfig() {
  const prisma = getPrisma();
  const existing = await prisma.axisMiningConfig.findFirst({ orderBy: { updatedAt: "desc" } });
  if (existing) return existing;
  return prisma.axisMiningConfig.create({ data: {} });
}

const ANCHOR_PRICE_USD = 0.0005;

/** Converts an RM deposit value (subsidy amount or 10%-of-ad-spend) into $AXIS at the current FX + anchor price. */
export function rmToAxis(amountRm: number, fxRateRmPerUsd: number): number {
  const usd = amountRm / fxRateRmPerUsd;
  return usd / ANCHOR_PRICE_USD;
}
