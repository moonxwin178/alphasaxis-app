import "server-only";
import { getPrisma } from "./prisma";
import type { AxisLedgerSource } from "@/generated/prisma/client";

/**
 * Sinking-fund emission model for the Agent2Mine Incentive Pool.
 *
 * Confirmed real numbers: pool = 32% of 178B total $AXIS supply = 56.96B
 * tokens, anchor price $0.0005 for this pool specifically (distinct from
 * AxisPrestige's $0.0001 founder mint price), 60-month (5yr) vesting
 * horizon. Seeded once into AxisMiningPoolConfig — see prisma/schema.prisma.
 *
 * TierWeight matches the existing AxisZero/One/Pro Agent2Mine multipliers in
 * src/lib/commission.ts (0.5 / 1.5 / 2.0). AxisPrestige holders aren't part
 * of Agent2Mine task-mining — they draw from the separate quarterly
 * distribution instead (src/lib/axisPrestigeDistribution.ts).
 */
export const TIER_WEIGHT = {
  AXIS_ZERO: 0.5,
  AXIS_ONE: 1.5,
  AXIS_PRO: 2.0,
} as const;

export type MiningTier = keyof typeof TIER_WEIGHT;

export interface ActiveUserCount {
  tier: MiningTier;
  count: number;
}

/** RemainingMonths = vestingMonths - whole months elapsed since startDate, floored at 1 so the pool never divides by zero once exhausted. */
export function remainingMonths(startDate: Date, vestingMonths: number, now: Date = new Date()): number {
  const elapsedMs = now.getTime() - startDate.getTime();
  const elapsedMonths = Math.floor(elapsedMs / (30.44 * 24 * 60 * 60 * 1000));
  return Math.max(1, vestingMonths - elapsedMonths);
}

/** MonthlyEmissionBudget = RemainingPool ÷ RemainingMonths. */
export function monthlyEmissionBudget(remainingPool: number, monthsLeft: number): number {
  return remainingPool / monthsLeft;
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

// Confirmed real numbers: 32% of 178B total $AXIS supply, 60-month horizon,
// $0.0005 anchor price for this pool specifically.
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

  const [awardedAgg, nftHoldings] = await Promise.all([
    prisma.axisVestingLedgerEntry.aggregate({
      where: { source: "AGENT2MINE_TASK" },
      _sum: { delta: true },
    }),
    prisma.nftHolding.findMany({
      where: {
        tier: { in: ["AXIS_ZERO", "AXIS_ONE", "AXIS_PRO"] },
        verificationStatus: "VERIFIED",
      },
      distinct: ["userId"],
      select: { tier: true },
    }),
  ]);

  const totalPool = Number(config.totalPoolTokens);
  const alreadyAwarded = Number(awardedAgg._sum.delta ?? 0);
  const remainingPool = Math.max(0, totalPool - alreadyAwarded);
  const monthsLeft = remainingMonths(config.startDate, config.vestingMonths);
  const budget = monthlyEmissionBudget(remainingPool, monthsLeft);

  const activeUsers: ActiveUserCount[] = (["AXIS_ZERO", "AXIS_ONE", "AXIS_PRO"] as MiningTier[]).map((tier) => ({
    tier,
    count: nftHoldings.filter((h) => h.tier === tier).length,
  }));

  const capByTier = Object.fromEntries(
    (["AXIS_ZERO", "AXIS_ONE", "AXIS_PRO"] as MiningTier[]).map((tier) => [
      tier,
      perUserMonthlyCap(budget, tier, activeUsers),
    ])
  ) as Record<MiningTier, number>;

  return {
    totalPool,
    remainingPool,
    monthsLeft,
    monthlyEmissionBudget: budget,
    anchorPriceUsd: Number(config.anchorPriceUsd),
    activeUsers,
    capByTier,
  };
}
