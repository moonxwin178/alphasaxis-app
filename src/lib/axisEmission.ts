import "server-only";
import { getPrisma } from "./prisma";
import type { AxisLedgerSource } from "@/generated/prisma/client";

/**
 * Sinking-fund emission model for the Agent2Mine Incentive Pool.
 *
 * Confirmed real numbers: pool = 32% of 178B total $AXIS supply = 56.96B
 * tokens, anchor price $0.0005 for this pool specifically (distinct from
 * AxisPrestige's $0.0001 founder mint price). Seeded once into
 * AxisMiningPoolConfig — see prisma/schema.prisma.
 *
 * TierWeight matches the existing AxisZero/One/Pro/Prestige Agent2Mine
 * multipliers in src/lib/commission.ts (0.5 / 1.5 / 2.0 / 3.0). AxisPrestige
 * holders participate in this same deposit-and-mine-out system on top of
 * (not instead of) their separate node token-vesting and AES revenue-share
 * tracks — per the confirmed design, "same rules apply."
 */
export const TIER_WEIGHT = {
  AXIS_ZERO: 0.5,
  AXIS_ONE: 1.5,
  AXIS_PRO: 2.0,
  AXIS_PRESTIGE: 3.0,
} as const;

export type MiningTier = keyof typeof TIER_WEIGHT;

export interface ActiveUserCount {
  tier: MiningTier;
  count: number;
}

/**
 * Milestone-based halving (confirmed: every 17,800 net-new active miners),
 * NOT calendar-based. This replaces the earlier RemainingMonths countdown,
 * which had a real cliff bug: if actual usage ran below the calculated
 * caps (very likely in year one), the calendar clock still hit its floor
 * at month 60 regardless, at which point the ENTIRE unclaimed remainder
 * would become claimable in a single month. Tying the decay to cumulative
 * onboarded miners instead means slow growth genuinely stretches the
 * runway and fast growth means scarcity arrives sooner — either way the
 * platform is winning, and there's no cliff.
 *
 * Each halving epoch's effective monthly rate is BASE_MONTHLY_RATE × 0.5^epoch,
 * where BASE_MONTHLY_RATE is the pool's original month-1 rate (totalPool ÷ 60).
 * Asymptotic — mathematically never reaches exactly zero (same as Bitcoin's
 * satoshi tail), practically ~99.9% distributed by epoch 10.
 */
export const HALVING_MILESTONE_MINERS = 17_800;

export async function getHalvingEpoch(): Promise<number> {
  const prisma = getPrisma();
  const [taskMiners, depositMiners] = await Promise.all([
    prisma.axisVestingLedgerEntry.findMany({
      where: { source: "AGENT2MINE_TASK" },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.miningPoolLedgerEntry.findMany({
      where: { source: "DEPOSIT" },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);
  const cumulativeMiners = new Set([...taskMiners.map((m) => m.userId), ...depositMiners.map((m) => m.userId)]).size;
  return Math.floor(cumulativeMiners / HALVING_MILESTONE_MINERS);
}

/** Effective monthly budget at a given halving epoch — the pool's month-1 rate, halved once per epoch crossed. */
export function monthlyBudgetForEpoch(totalPool: number, vestingMonths: number, epoch: number): number {
  const baseMonthlyRate = totalPool / vestingMonths;
  return baseMonthlyRate * Math.pow(0.5, epoch);
}

/**
 * PerUserMonthlyCap = (MonthlyEmissionBudget × TierWeight) ÷ Σ(ActiveUsers × TierWeight).
 * Returns 0 if there are no active users in any tier (nothing to divide by).
 */
export function perUserMonthlyCap(
  monthlyBudget: number,
  tier: MiningTier,
  activeUsers: ActiveUserCount[]
): number {
  const weightedTotal = activeUsers.reduce((sum, u) => sum + u.count * TIER_WEIGHT[u.tier], 0);
  if (weightedTotal <= 0) return 0;
  return (monthlyBudget * TIER_WEIGHT[tier]) / weightedTotal;
}

// Confirmed real numbers: 32% of 178B total $AXIS supply, 60-month horizon
// (used only as the BASE_MONTHLY_RATE reference for halving, not a hard
// deadline anymore), $0.0005 anchor price for this pool specifically.
const AGENT2MINE_POOL_TOKENS = 56_960_000_000;
const AGENT2MINE_VESTING_MONTHS = 60;
const AGENT2MINE_ANCHOR_PRICE_USD = 0.0005;

/** Lazily seeds the one config row on first use — same pattern as getGrandMasterId(). startDate anchors "now" the first time this runs, i.e. beta launch. */
export async function getOrCreatePoolConfig() {
  const prisma = getPrisma();
  const existing = await prisma.axisMiningPoolConfig.findFirst({ orderBy: { createdAt: "desc" } });
  if (existing) return existing;

  return prisma.axisMiningPoolConfig.create({
    data: {
      totalPoolTokens: AGENT2MINE_POOL_TOKENS,
      vestingMonths: AGENT2MINE_VESTING_MONTHS,
      startDate: new Date(),
      anchorPriceUsd: AGENT2MINE_ANCHOR_PRICE_USD,
    },
  });
}

/** A user's earned-but-not-yet-distributed $AXIS balance — SUM(delta) over their vesting ledger, same pattern as getPointsBalance/getWalletBalance. Pass `source` to isolate Agent2Mine mining from AxisPrestige quarterly distributions — they're deliberately separate mechanisms. */
export async function getAxisVestingBalance(userId: string, source?: AxisLedgerSource): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.axisVestingLedgerEntry.aggregate({
    where: source ? { userId, source } : { userId },
    _sum: { delta: true },
  });
  return Number(result._sum.delta ?? 0);
}

/** Live snapshot of the emission model against real DB state — the numbers a submission approval or an admin dashboard should show. */
export async function getEmissionSnapshot() {
  const prisma = getPrisma();

  const config = await getOrCreatePoolConfig();

  const [awardedAgg, nftHoldings, halvingEpoch] = await Promise.all([
    prisma.axisVestingLedgerEntry.aggregate({
      where: { source: "AGENT2MINE_TASK" },
      _sum: { delta: true },
    }),
    prisma.nftHolding.findMany({
      where: {
        tier: { in: ["AXIS_ZERO", "AXIS_ONE", "AXIS_PRO", "AXIS_PRESTIGE"] },
        verificationStatus: "VERIFIED",
      },
      distinct: ["userId"],
      select: { tier: true },
    }),
    getHalvingEpoch(),
  ]);

  const totalPool = Number(config.totalPoolTokens);
  const alreadyAwarded = Number(awardedAgg._sum.delta ?? 0);
  const remainingPool = Math.max(0, totalPool - alreadyAwarded);
  const budget = monthlyBudgetForEpoch(totalPool, config.vestingMonths, halvingEpoch);

  const ALL_TIERS: MiningTier[] = ["AXIS_ZERO", "AXIS_ONE", "AXIS_PRO", "AXIS_PRESTIGE"];
  const activeUsers: ActiveUserCount[] = ALL_TIERS.map((tier) => ({
    tier,
    count: nftHoldings.filter((h) => h.tier === tier).length,
  }));

  const capByTier = Object.fromEntries(
    ALL_TIERS.map((tier) => [tier, perUserMonthlyCap(budget, tier, activeUsers)])
  ) as Record<MiningTier, number>;

  return {
    totalPool,
    remainingPool,
    halvingEpoch,
    monthlyEmissionBudget: budget,
    anchorPriceUsd: Number(config.anchorPriceUsd),
    activeUsers,
    capByTier,
  };
}
