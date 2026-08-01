import "server-only";
import { getPrisma } from "./prisma";
import type { AesRevenueTarget } from "@/generated/prisma/client";

/**
 * AES net revenue (the broader Alphas Estate Solutions business — HQ sales
 * plus branch/agency contributions, NOT just the 30% AES commission line
 * item from loan disbursements) is a real consolidated figure outside this
 * platform's database, so an admin logs it manually. 10% of that figure is
 * earmarked for this whole program, split into six fixed targets.
 */
export const AES_REVENUE_SPLIT: Record<AesRevenueTarget, number> = {
  NODE_POOL_A: 0.01,
  NODE_POOL_B: 0.01,
  NODE_POOL_C: 0.01,
  BUYBACK_BURN: 0.035,
  STRATEGIC_RESERVE: 0.021,
  OPERATIONS: 0.014,
};

export async function getAesTargetBalance(target: AesRevenueTarget): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.aesRevenueLedgerEntry.aggregate({ where: { target }, _sum: { amountUsd: true } });
  return Number(result._sum.amountUsd ?? 0);
}

/** Logs one real AES net-revenue figure and auto-computes all six target splits from it. */
export async function contributeAesRevenue(aesNetRevenueUsd: number, note: string, createdById: string): Promise<void> {
  const prisma = getPrisma();
  const targets = Object.keys(AES_REVENUE_SPLIT) as AesRevenueTarget[];

  await prisma.$transaction(
    targets.map((target) =>
      prisma.aesRevenueLedgerEntry.create({
        data: { target, amountUsd: aesNetRevenueUsd * AES_REVENUE_SPLIT[target], note, createdById },
      })
    )
  );
}

/**
 * Node-count-tiered eligibility: 1+ nodes qualifies for Pool A, 5+ also
 * qualifies for Pool B (in addition to A), 10+ also qualifies for Pool C
 * (in addition to A+B) — a 10-node holder shares in all three
 * simultaneously. Split evenly per qualifying PERSON within each pool, not
 * weighted further by node count (the node-count reward is already "which
 * pools you qualify for").
 */
export async function getQualifyingNodeHolders(minNodes: number): Promise<string[]> {
  const prisma = getPrisma();
  const holdings = await prisma.nftHolding.groupBy({
    by: ["userId"],
    where: { tier: "AXIS_PRESTIGE", verificationStatus: "VERIFIED" },
    _count: { id: true },
  });
  return holdings.filter((h) => h._count.id >= minNodes).map((h) => h.userId);
}

const POOL_MIN_NODES: Record<"NODE_POOL_A" | "NODE_POOL_B" | "NODE_POOL_C", number> = {
  NODE_POOL_A: 1,
  NODE_POOL_B: 5,
  NODE_POOL_C: 10,
};

export interface AesPoolDistributionResult {
  distributionId: string;
  recipients: number;
  perPersonUsd: number;
}

/** Distributes a pool's accumulated balance evenly across qualifying node holders, paid to their in-app wallet. */
export async function runAesNodePoolDistribution(
  target: "NODE_POOL_A" | "NODE_POOL_B" | "NODE_POOL_C",
  createdById: string
): Promise<AesPoolDistributionResult | { error: string }> {
  const prisma = getPrisma();

  const balance = await getAesTargetBalance(target);
  if (balance <= 0) return { error: "This pool has no balance to distribute." };

  const recipients = await getQualifyingNodeHolders(POOL_MIN_NODES[target]);
  if (recipients.length === 0) return { error: "No qualifying node holders for this pool yet." };

  const perPersonUsd = balance / recipients.length;

  const distribution = await prisma.aesNodePoolDistribution.create({
    data: { target, totalUsd: balance, recipients: recipients.length, perPersonUsd },
  });

  await prisma.$transaction([
    ...recipients.map((userId) =>
      prisma.aesNodePoolDistributionLine.create({
        data: { distributionId: distribution.id, userId, amountUsd: perPersonUsd },
      })
    ),
    ...recipients.map((userId) =>
      prisma.walletLedgerEntry.create({
        data: { userId, delta: perPersonUsd, reason: "AES_NODE_POOL_SHARE", refId: distribution.id },
      })
    ),
    prisma.aesRevenueLedgerEntry.create({
      data: { target, amountUsd: -balance, note: `Distribution ${distribution.id}`, createdById },
    }),
  ]);

  return { distributionId: distribution.id, recipients: recipients.length, perPersonUsd };
}
