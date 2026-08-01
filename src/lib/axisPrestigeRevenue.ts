import "server-only";
import { getPrisma } from "./prisma";

/**
 * AxisPrestige quarterly revenue-share distribution — paid in USD/USDT
 * terms to the in-app wallet, funded by a running pool that admins
 * contribute to as real cases actually convert (per the confirmed rule:
 * "when there's an actual converted case, the $$$ amount will be inserted
 * by the admin to a pool and this pool shall distribute accordingly").
 * Distinct from $AXIS token vesting — see axisPrestigeVesting.ts.
 */

export async function getPrestigePoolBalance(): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.axisPrestigeRevenuePoolEntry.aggregate({ _sum: { amountUsd: true } });
  return Number(result._sum.amountUsd ?? 0);
}

export async function contributeToPrestigePool(
  amountUsd: number,
  caseId: string | null,
  note: string | null,
  createdById: string
): Promise<void> {
  const prisma = getPrisma();
  await prisma.axisPrestigeRevenuePoolEntry.create({
    data: {
      amountUsd,
      source: caseId ? "CASE_CONTRIBUTION" : "ADMIN_ADJUST",
      caseId,
      note,
      createdById,
    },
  });
}

export async function getVerifiedPrestigeNodes() {
  const prisma = getPrisma();
  return prisma.nftHolding.findMany({
    where: { tier: "AXIS_PRESTIGE", verificationStatus: "VERIFIED" },
    select: { id: true, userId: true },
  });
}

export interface RunDistributionResult {
  distributionId: string;
  nodeCount: number;
  perNodeUsd: number;
}

/**
 * Splits amountUsd evenly across every verified node (regardless of that
 * node's token-vesting burn status — revenue share is a standing node
 * entitlement, not gated by the 25x cap). Each recipient's share is
 * credited to their in-app USD wallet AND logged as realized value, since
 * it counts toward their own node's 25x burn threshold.
 */
export async function runRevenueDistribution(
  label: string,
  amountUsd: number,
  createdById: string
): Promise<RunDistributionResult | { error: string }> {
  const prisma = getPrisma();

  const poolBalance = await getPrestigePoolBalance();
  if (amountUsd > poolBalance) {
    return { error: `Only $${poolBalance.toLocaleString()} is available in the pool.` };
  }

  const nodes = await getVerifiedPrestigeNodes();
  if (nodes.length === 0) return { error: "No verified AxisPrestige nodes to distribute to." };

  const perNodeUsd = amountUsd / nodes.length;

  const distribution = await prisma.axisPrestigeDistribution.create({
    data: { label, totalDistributedUsd: amountUsd, createdById },
  });

  await prisma.$transaction([
    ...nodes.map((n) =>
      prisma.axisPrestigeDistributionLine.create({
        data: { distributionId: distribution.id, userId: n.userId, nftHoldingId: n.id, amountUsd: perNodeUsd },
      })
    ),
    ...nodes.map((n) =>
      prisma.walletLedgerEntry.create({
        data: { userId: n.userId, delta: perNodeUsd, reason: "AXISPRESTIGE_REVENUE_SHARE", refId: distribution.id },
      })
    ),
    ...nodes.map((n) =>
      prisma.axisRealizedValueEntry.create({
        data: { userId: n.userId, amountUsd: perNodeUsd, source: "REVENUE_DISTRIBUTION", note: label },
      })
    ),
    prisma.axisPrestigeRevenuePoolEntry.create({
      data: { amountUsd: -amountUsd, source: "DISTRIBUTION_PAYOUT", note: label, createdById },
    }),
  ]);

  return { distributionId: distribution.id, nodeCount: nodes.length, perNodeUsd };
}
