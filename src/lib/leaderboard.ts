import { getPrisma } from "./prisma";
import type { NftTier } from "@/generated/prisma/client";

export interface LeaderboardRow {
  rank: number;
  displayName: string;
  tier: NftTier;
  referralCount: number;
}

/** Never exposes name/email/phone — displayName or a masked fallback only. */
export async function getReferralLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const prisma = getPrisma();

  const grouped = await prisma.user.groupBy({
    by: ["referredById"],
    where: { referredById: { not: null } },
    _count: { referredById: true },
    orderBy: { _count: { referredById: "desc" } },
    take: limit,
  });

  const userIds = grouped.map((g) => g.referredById).filter((id): id is string => id !== null);
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      displayName: true,
      referralCode: true,
      nftHoldings: {
        where: { verificationStatus: "VERIFIED" },
        orderBy: { multiplier: "desc" },
        take: 1,
        select: { tier: true },
      },
    },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return grouped
    .map((g, i) => {
      const user = g.referredById ? byId.get(g.referredById) : undefined;
      if (!user) return null;
      return {
        rank: i + 1,
        displayName: user.displayName ?? `Agent ${user.referralCode.slice(-4)}`,
        tier: user.nftHoldings[0]?.tier ?? ("AXIS_ZERO" as NftTier),
        referralCount: g._count.referredById,
      };
    })
    .filter((row): row is LeaderboardRow => row !== null);
}
