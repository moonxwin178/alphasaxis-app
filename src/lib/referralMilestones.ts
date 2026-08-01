import "server-only";
import { getPrisma } from "./prisma";
import { TIER_WEIGHT, type MiningTier } from "./axisEmission";

/**
 * Network-to-Earn milestone rewards — paid in claimable $AXIS (source
 * AGENT2MINE_TASK, same as mined tasks), so like everything else earned
 * this session it must be locked into a vesting term before it's spendable
 * (see axisClaimVesting.ts). A referred user counts toward whichever tier
 * is their current BEST verified NFT holding (same lookup miningPowerMultiplier
 * uses) — so a referral that later upgrades tiers shifts from a lower
 * milestone to a higher one, not double-counted.
 *
 * Reward amounts are a placeholder default (base unit × tier weight ×
 * threshold/5, rounded), consistent with how SUBMIT_TASKS/SOCIAL_TASKS
 * point values are also flat hardcoded constants in this codebase — flag
 * for confirmation before real-money launch, same as those.
 */
const BASE_UNIT_AXIS = 500;

function tierReward(tier: MiningTier, threshold: number): number {
  return Math.round(BASE_UNIT_AXIS * TIER_WEIGHT[tier] * (threshold / 5));
}

export interface ReferralMilestone {
  key: string;
  label: string;
  tier?: MiningTier;
  threshold: number;
  rewardAxis: number;
}

export const REFERRAL_MILESTONES: ReferralMilestone[] = [
  { key: "ref_zero_5", label: "Refer 5 AxisZero members", tier: "AXIS_ZERO", threshold: 5, rewardAxis: tierReward("AXIS_ZERO", 5) },
  { key: "ref_zero_10", label: "Refer 10 AxisZero members", tier: "AXIS_ZERO", threshold: 10, rewardAxis: tierReward("AXIS_ZERO", 10) },
  { key: "ref_one_5", label: "Refer 5 AxisOne (Agent) members", tier: "AXIS_ONE", threshold: 5, rewardAxis: tierReward("AXIS_ONE", 5) },
  { key: "ref_one_10", label: "Refer 10 AxisOne (Agent) members", tier: "AXIS_ONE", threshold: 10, rewardAxis: tierReward("AXIS_ONE", 10) },
  { key: "ref_pro_5", label: "Refer 5 AxisPro (Agency) members", tier: "AXIS_PRO", threshold: 5, rewardAxis: tierReward("AXIS_PRO", 5) },
  { key: "ref_pro_10", label: "Refer 10 AxisPro (Agency) members", tier: "AXIS_PRO", threshold: 10, rewardAxis: tierReward("AXIS_PRO", 10) },
  { key: "ref_prestige_3", label: "Refer 3 AxisPrestige node holders", tier: "AXIS_PRESTIGE", threshold: 3, rewardAxis: tierReward("AXIS_PRESTIGE", 3) },
  { key: "ref_prestige_5", label: "Refer 5 AxisPrestige node holders", tier: "AXIS_PRESTIGE", threshold: 5, rewardAxis: tierReward("AXIS_PRESTIGE", 5) },
  { key: "ref_total_20", label: "Refer 20 people total (any tier)", threshold: 20, rewardAxis: 2000 },
  { key: "ref_total_50", label: "Refer 50 people total (any tier)", threshold: 50, rewardAxis: 6000 },
];

export interface MilestoneStatus extends ReferralMilestone {
  progress: number;
  eligible: boolean;
  claimed: boolean;
}

export async function getReferralMilestoneStatus(userId: string): Promise<MilestoneStatus[]> {
  const prisma = getPrisma();
  const [referred, claimed] = await Promise.all([
    prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        nftHoldings: { where: { verificationStatus: "VERIFIED" }, select: { tier: true, multiplier: true } },
      },
    }),
    prisma.axisVestingLedgerEntry.findMany({
      where: { userId, source: "AGENT2MINE_TASK", refId: { in: REFERRAL_MILESTONES.map((m) => m.key) } },
      select: { refId: true },
    }),
  ]);

  const claimedKeys = new Set(claimed.map((c) => c.refId));
  const tierCounts: Record<MiningTier, number> = { AXIS_ZERO: 0, AXIS_ONE: 0, AXIS_PRO: 0, AXIS_PRESTIGE: 0 };
  for (const r of referred) {
    const bestTier = (r.nftHoldings.sort((a, b) => b.multiplier - a.multiplier)[0]?.tier ?? "AXIS_ZERO") as MiningTier;
    tierCounts[bestTier] += 1;
  }
  const totalReferred = referred.length;

  return REFERRAL_MILESTONES.map((m) => {
    const progress = m.tier ? tierCounts[m.tier] : totalReferred;
    return { ...m, progress, eligible: progress >= m.threshold, claimed: claimedKeys.has(m.key) };
  });
}

export interface ClaimMilestoneResult {
  ok: boolean;
  error?: string;
}

export async function claimReferralMilestone(userId: string, key: string): Promise<ClaimMilestoneResult> {
  const milestone = REFERRAL_MILESTONES.find((m) => m.key === key);
  if (!milestone) return { ok: false, error: "Unknown milestone." };

  const statuses = await getReferralMilestoneStatus(userId);
  const status = statuses.find((s) => s.key === key);
  if (!status?.eligible) return { ok: false, error: "Not eligible yet." };
  if (status.claimed) return { ok: false, error: "Already claimed." };

  const prisma = getPrisma();
  await prisma.axisVestingLedgerEntry.create({
    data: { userId, delta: milestone.rewardAxis, source: "AGENT2MINE_TASK", refId: key },
  });

  return { ok: true };
}
