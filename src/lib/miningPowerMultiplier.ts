import "server-only";
import { getPrisma } from "./prisma";
import { TIER_WEIGHT, type MiningTier } from "./axisEmission";

/**
 * Mining Power Multiplier (MPM) — the Pi Network mechanic. Each ACTIVE
 * direct referral boosts your share of the shared, fixed monthly pool.
 * "Active" means the referred user has done at least one qualifying action
 * in the trailing 30 days — raw signup counts don't count, only real
 * engagement (Pi Network's own lesson: hollow referrals get gamed).
 *
 * Weighted by the referred user's own tier, so referring a paying
 * Agent/Agency counts for meaningfully more than referring a free AxisZero
 * signup: +2% × that referral's tier weight (0.5/1.5/2.0/3.0), capped at
 * +50% total (a zero-sum reallocation of the fixed pool, never new
 * inflation — safe regardless of how viral it gets).
 */
const BONUS_PER_TIER_WEIGHT = 0.02;
const MPM_CAP = 0.5;
const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function getMiningPowerMultiplier(userId: string): Promise<number> {
  const prisma = getPrisma();
  const since = new Date(Date.now() - ACTIVE_WINDOW_MS);

  const referrals = await prisma.user.findMany({
    where: { referredById: userId },
    select: {
      id: true,
      nftHoldings: { where: { verificationStatus: "VERIFIED" }, select: { tier: true, multiplier: true } },
    },
  });

  if (referrals.length === 0) return 1;

  let bonus = 0;
  for (const referral of referrals) {
    const isActive = await isUserActiveSince(referral.id, since);
    if (!isActive) continue;

    const bestTier = referral.nftHoldings.sort((a, b) => b.multiplier - a.multiplier)[0]?.tier as MiningTier | undefined;
    const tierWeight = bestTier ? (TIER_WEIGHT[bestTier] ?? TIER_WEIGHT.AXIS_ZERO) : TIER_WEIGHT.AXIS_ZERO;
    bonus += BONUS_PER_TIER_WEIGHT * tierWeight;
  }

  return 1 + Math.min(MPM_CAP, bonus);
}

async function isUserActiveSince(userId: string, since: Date): Promise<boolean> {
  const prisma = getPrisma();
  const [points, mining, pool] = await Promise.all([
    prisma.pointsLedgerEntry.findFirst({ where: { userId, createdAt: { gte: since } }, select: { id: true } }),
    prisma.axisVestingLedgerEntry.findFirst({ where: { userId, createdAt: { gte: since } }, select: { id: true } }),
    prisma.miningPoolLedgerEntry.findFirst({ where: { userId, createdAt: { gte: since } }, select: { id: true } }),
  ]);
  return !!(points || mining || pool);
}
