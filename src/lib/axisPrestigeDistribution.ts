import "server-only";
import { getPrisma } from "./prisma";

/**
 * AxisPrestige quarterly distribution — a distinct mechanism from Agent2Mine
 * task-based mining (src/lib/axisEmission.ts). Draws from the "Early
 * Backers" allocation (18% of 178B total supply = 32.04B tokens) and pays
 * out to AxisPrestige node holders once a quarter, split evenly per
 * verified node (a user holding 2 nodes gets 2 shares).
 *
 * The 32.04B figure is the total Early Backers allocation, not a
 * per-quarter budget — how much of it to release each quarter is an admin
 * decision (see the exact split cadence/schedule flagged to the user), so
 * this module doesn't auto-compute a "monthly emission"-style budget the
 * way Agent2Mine does.
 */
export const EARLY_BACKERS_POOL_TOKENS = 32_040_000_000;

export async function getVerifiedPrestigeNodes() {
  const prisma = getPrisma();
  return prisma.nftHolding.findMany({
    where: { tier: "AXIS_PRESTIGE", verificationStatus: "VERIFIED" },
    select: { id: true, userId: true },
  });
}

export interface CreateDistributionResult {
  distributionId: string;
  nodeCount: number;
  perNodeAmount: number;
}

export async function createAxisPrestigeDistribution(
  quarterLabel: string,
  totalDistributedTokens: number,
  createdById: string
): Promise<CreateDistributionResult | { error: string }> {
  const prisma = getPrisma();
  const nodes = await getVerifiedPrestigeNodes();

  if (nodes.length === 0) return { error: "No verified AxisPrestige nodes to distribute to." };

  const perNodeAmount = totalDistributedTokens / nodes.length;

  const distribution = await prisma.axisPrestigeDistribution.create({
    data: {
      quarterLabel,
      totalDistributedTokens,
      perNodeAmount,
      createdById,
    },
  });

  await prisma.$transaction([
    ...nodes.map((n) =>
      prisma.axisPrestigeDistributionLine.create({
        data: { distributionId: distribution.id, userId: n.userId, nftHoldingId: n.id, amount: perNodeAmount },
      })
    ),
    ...nodes.map((n) =>
      prisma.axisVestingLedgerEntry.create({
        data: { userId: n.userId, delta: perNodeAmount, source: "AXISPRESTIGE_QUARTERLY", refId: distribution.id },
      })
    ),
  ]);

  return { distributionId: distribution.id, nodeCount: nodes.length, perNodeAmount };
}
