import "server-only";
import { getPrisma } from "./prisma";

/**
 * Lazily-seeded single-row config for every tokenomics knob an admin might
 * need to tune post-launch: the genuinely volatile external numbers
 * (government petrol subsidy rate, RM/USD FX rate), plus the business
 * levers that started as hardcoded constants (halving milestone size, MPM
 * bonus/cap, ads deposit rate, mint-cycling burn/reserve split, and the
 * four vesting-lock payout percentages). Edited via the admin settings
 * form on /admin/mining — see updateMiningConfig in actions/admin.ts.
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
