import "server-only";
import { getPrisma } from "./prisma";
import { getGrandMasterId } from "./grandMaster";
import type { BrokerageTier } from "./commissionEngine";
import type { NftTier } from "@/generated/prisma/client";

const TIER_RANK: Record<Extract<NftTier, "AXIS_ZERO" | "AXIS_ONE" | "AXIS_PRO">, number> = {
  AXIS_ZERO: 0,
  AXIS_ONE: 1,
  AXIS_PRO: 2,
};

/**
 * A user's brokerage tier for commission purposes — their best VERIFIED
 * holding among AxisZero/One/Pro. AxisPrestige is deliberately excluded:
 * it's a node-holder/Early-Backers mechanism (quarterly distributions),
 * not a brokerage identity, so it doesn't participate in deal commissions.
 * Defaults to AxisZero (every account's automatic baseline).
 */
export async function resolveBrokerageTier(userId: string): Promise<BrokerageTier> {
  const prisma = getPrisma();
  const holdings = await prisma.nftHolding.findMany({
    where: {
      userId,
      verificationStatus: "VERIFIED",
      tier: { in: ["AXIS_ZERO", "AXIS_ONE", "AXIS_PRO"] },
    },
    select: { tier: true },
  });

  let best: BrokerageTier = "AXIS_ZERO";
  for (const h of holdings) {
    const tier = h.tier as keyof typeof TIER_RANK;
    if (TIER_RANK[tier] > TIER_RANK[best as keyof typeof TIER_RANK]) best = tier;
  }
  return best;
}

/**
 * Resolves who Party 2 (the 3% upline override) actually goes to: the
 * introducer's real upline, or the introducer themselves if their upline
 * is the Grand Master 001 placeholder (confirmed rule — 001 never
 * personally receives an override).
 */
export async function resolveUplineRecipientId(introducerId: string): Promise<string> {
  const prisma = getPrisma();
  const [introducer, grandMasterId] = await Promise.all([
    prisma.user.findUnique({ where: { id: introducerId }, select: { referredById: true } }),
    getGrandMasterId(),
  ]);

  if (!introducer?.referredById || introducer.referredById === grandMasterId) {
    return introducerId;
  }
  return introducer.referredById;
}
