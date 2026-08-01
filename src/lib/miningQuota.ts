import type { NftTier } from "@/generated/prisma/client";

/**
 * Deposit quotas — the RM-denominated gate on how much real-world verified
 * spend can enter a user's mining pool per period. Deliberately a simple,
 * fixed, tier-scaled table (not derived from the population-relative
 * formula) — meant to be as transparent as "you can mine X per day," and to
 * protect against receipt-farming. The mine-out cap (src/lib/miningPool.ts)
 * is the separate, sophisticated throttle that protects actual pool
 * solvency — these two layers are independent and both matter.
 *
 * Same-calendar-month-only, no rollover: exceeding a period's quota rejects
 * further deposits that period outright, it does not queue to next period.
 */
export interface TierQuota {
  petrolWeeklyRm: number;
  petrolMonthlyRm: number;
  adsWeeklyRm: number;
  adsMonthlyRm: number;
}

export const TIER_QUOTA: Record<Extract<NftTier, "AXIS_ZERO" | "AXIS_ONE" | "AXIS_PRO" | "AXIS_PRESTIGE">, TierQuota> = {
  AXIS_ZERO: { petrolWeeklyRm: 80, petrolMonthlyRm: 320, adsWeeklyRm: 178, adsMonthlyRm: 712 },
  AXIS_ONE: { petrolWeeklyRm: 120, petrolMonthlyRm: 480, adsWeeklyRm: 300, adsMonthlyRm: 1_200 },
  AXIS_PRO: { petrolWeeklyRm: 160, petrolMonthlyRm: 640, adsWeeklyRm: 400, adsMonthlyRm: 1_600 },
  AXIS_PRESTIGE: { petrolWeeklyRm: 240, petrolMonthlyRm: 960, adsWeeklyRm: 600, adsMonthlyRm: 2_400 },
};

/** Ads deposit value = 10% of verified ad spend. Petrol deposit value = the actual government subsidy amount (see AxisMiningConfig.petrolSubsidyRate, admin-editable). */
export const ADS_DEPOSIT_RATE = 0.10;
