import type { FinancingType, NftTier } from "@/generated/prisma/client";

// Commission rates are AlphasAxis's own schedule (not derived from the design
// prototype's mockup numbers, which weren't a real formula) — small
// percentages typical of Malaysian loan-referral commissions.
const RATE_BY_FINANCING_TYPE: Record<FinancingType, number> = {
  MORTGAGE: 0.003,
  HIRE_PURCHASE: 0.01,
  PERSONAL: 0.02,
  BUSINESS: 0.015,
};

export const TIER_MULTIPLIER: Record<NftTier, number> = {
  AXIS_ZERO: 0.5,
  AXIS_ONE: 1.5,
  AXIS_PRO: 2,
  AXIS_PRESTIGE: 3,
};

export const TIER_LABEL: Record<NftTier, string> = {
  AXIS_ZERO: "AxisZero",
  AXIS_ONE: "AxisOne",
  AXIS_PRO: "AxisPro",
  AXIS_PRESTIGE: "AxisPrestige",
};

export const TIER_IMAGE: Record<NftTier, string> = {
  AXIS_ZERO: "/nft/axiszero.png",
  AXIS_ONE: "/nft/axisone.png",
  AXIS_PRO: "/nft/axispro.png",
  AXIS_PRESTIGE: "/nft/axisprestige.png",
};

/** Rounds to 2dp — commission amounts are currency, never leak float noise to the UI or DB. */
export function computeCommission(caseAmount: number, financingType: FinancingType, tier: NftTier | null): number {
  const base = caseAmount * RATE_BY_FINANCING_TYPE[financingType];
  const multiplier = tier ? TIER_MULTIPLIER[tier] : 1;
  return Math.round(base * multiplier * 100) / 100;
}

export function commissionRatePercent(financingType: FinancingType): string {
  return `${(RATE_BY_FINANCING_TYPE[financingType] * 100).toFixed(1)}%`;
}
