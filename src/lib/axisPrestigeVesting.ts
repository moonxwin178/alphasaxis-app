import "server-only";
import { getPrisma } from "./prisma";

/**
 * AxisPrestige $AXIS token vesting — distinct from the quarterly USD/USDT
 * revenue share (src/lib/axisPrestigeRevenue.ts). Confirmed real numbers:
 * $500/node at the $0.0001 AxisPrestige anchor price = 5,000,000 $AXIS
 * total allocation per node, drawn from the Early Backers pool (18% of
 * 178B = 32.04B tokens). 6-month cliff from verification, then linear
 * daily vesting over 5 years. performanceMultiplier (from Agent2Mine task
 * performance — see the flag on how it's set) speeds up vesting. Once a
 * holder's cumulative realized value (revenue share + token sales +
 * marketplace redemptions) hits 25x their $500 node cost ($12,500), the
 * node's remaining unvested allocation is burned — they've already taken
 * their upside.
 */
export const NODE_PRICE_USD = 500;
export const NODE_ANCHOR_PRICE_USD = 0.0001;
export const NODE_ALLOCATION_TOKENS = NODE_PRICE_USD / NODE_ANCHOR_PRICE_USD; // 5,000,000
export const EARLY_BACKERS_POOL_TOKENS = 32_040_000_000;
export const DEFAULT_CLIFF_MONTHS = 6;
export const DEFAULT_VESTING_MONTHS = 60;
export const REALIZED_VALUE_CAP_MULTIPLE = 25; // 25x of $500 = $12,500

const MS_PER_MONTH = 30.44 * 24 * 60 * 60 * 1000;

export interface NodeVestingState {
  allocationTokens: number;
  verifiedAt: Date;
  cliffMonths: number;
  vestingMonths: number;
  performanceMultiplier: number;
}

/**
 * Cliff-then-linear-daily vest, accelerated by performanceMultiplier
 * (a multiplier >1 shortens the effective vesting period, i.e. higher
 * "hash rate power" from stronger Agent2Mine task performance). Capped at
 * the full allocation regardless of multiplier.
 */
export function computeVestedTokens(node: NodeVestingState, now: Date = new Date()): number {
  const cliffEndsAt = node.verifiedAt.getTime() + node.cliffMonths * MS_PER_MONTH;
  if (now.getTime() < cliffEndsAt) return 0;

  const monthsSinceCliff = (now.getTime() - cliffEndsAt) / MS_PER_MONTH;
  const effectiveMonths = monthsSinceCliff * node.performanceMultiplier;
  const fraction = Math.min(1, effectiveMonths / node.vestingMonths);
  return node.allocationTokens * fraction;
}

/** Creates the vesting record the moment a node claim is admin-verified. */
export async function createNodeVesting(nftHoldingId: string, userId: string, verifiedAt: Date) {
  const prisma = getPrisma();
  return prisma.axisPrestigeNodeVesting.create({
    data: {
      nftHoldingId,
      userId,
      allocationTokens: NODE_ALLOCATION_TOKENS,
      verifiedAt,
      cliffMonths: DEFAULT_CLIFF_MONTHS,
      vestingMonths: DEFAULT_VESTING_MONTHS,
    },
  });
}

/** Sum of everything a user has realized (revenue share + token sales + marketplace redemptions), the input to the 25x burn cap. */
export async function getRealizedValueTotal(userId: string): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.axisRealizedValueEntry.aggregate({
    where: { userId },
    _sum: { amountUsd: true },
  });
  return Number(result._sum.amountUsd ?? 0);
}

export interface VestingRunLine {
  userId: string;
  nftHoldingId: string;
  amount: number;
}

/**
 * Processes every active (non-burned) node: checks the 25x burn cap first,
 * then credits whatever has newly vested since the last run. Admin-
 * triggered, not a real cron — see runAxisPrestigeVestingBatch in
 * actions/admin.ts. Idempotent: re-running with no time elapsed credits
 * nothing further.
 */
export async function runVestingBatch(): Promise<VestingRunLine[]> {
  const prisma = getPrisma();
  const nodes = await prisma.axisPrestigeNodeVesting.findMany({ where: { burned: false } });

  const lines: VestingRunLine[] = [];
  const now = new Date();

  for (const node of nodes) {
    const realizedTotal = await getRealizedValueTotal(node.userId);
    if (realizedTotal >= REALIZED_VALUE_CAP_MULTIPLE * NODE_PRICE_USD) {
      await prisma.axisPrestigeNodeVesting.update({
        where: { id: node.id },
        data: { burned: true, burnedAt: now },
      });
      continue;
    }

    const vestedToDate = computeVestedTokens(
      {
        allocationTokens: Number(node.allocationTokens),
        verifiedAt: node.verifiedAt,
        cliffMonths: node.cliffMonths,
        vestingMonths: node.vestingMonths,
        performanceMultiplier: node.performanceMultiplier,
      },
      now
    );
    const delta = vestedToDate - Number(node.cumulativeVested);
    if (delta <= 0) continue;

    await prisma.$transaction([
      prisma.axisVestingLedgerEntry.create({
        data: { userId: node.userId, delta, source: "AXISPRESTIGE_VESTING", refId: node.nftHoldingId },
      }),
      prisma.axisPrestigeNodeVesting.update({
        where: { id: node.id },
        data: { cumulativeVested: vestedToDate },
      }),
    ]);

    lines.push({ userId: node.userId, nftHoldingId: node.nftHoldingId, amount: delta });
  }

  return lines;
}
