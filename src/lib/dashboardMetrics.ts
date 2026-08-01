import "server-only";
import { getPrisma } from "./prisma";
import { TIER_LABEL, TIER_MULTIPLIER } from "./commission";
import { getEmissionSnapshot, getAxisVestingBalance, type MiningTier } from "./axisEmission";
import { computeVestedTokens, getRealizedValueTotal, REALIZED_VALUE_CAP_MULTIPLE, NODE_PRICE_USD } from "./axisPrestigeVesting";
import { getPointsBalance } from "./points";
import { getWalletBalance } from "./wallet";
import type { NftTier } from "@/generated/prisma/client";

/**
 * Real entitlement/metric rollups per role and tier — every number here
 * comes from the actual ledgers built this session (Agent2Mine emission,
 * AxisPrestige vesting/revenue, commission engine), not placeholders.
 */

export async function getUserEntitlements(userId: string) {
  const prisma = getPrisma();

  const [nftHolding, pointsBalance, axisBalance, walletBalance, referralCount, snapshot] = await Promise.all([
    prisma.nftHolding.findFirst({
      where: { userId, verificationStatus: "VERIFIED" },
      orderBy: { multiplier: "desc" },
    }),
    getPointsBalance(userId),
    getAxisVestingBalance(userId, "AGENT2MINE_TASK"),
    getWalletBalance(userId),
    prisma.user.count({ where: { referredById: userId } }),
    getEmissionSnapshot(),
  ]);

  const tier: NftTier = nftHolding?.tier ?? "AXIS_ZERO";
  const miningTier = (tier === "AXIS_PRESTIGE" ? "AXIS_PRO" : tier) as MiningTier;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const awardedThisMonth = await prisma.axisVestingLedgerEntry.aggregate({
    where: { userId, source: "AGENT2MINE_TASK", createdAt: { gte: monthStart } },
    _sum: { delta: true },
  });

  const monthlyCap = snapshot?.capByTier[miningTier] ?? 0;
  const usedThisMonth = Number(awardedThisMonth._sum.delta ?? 0);

  return {
    tier,
    tierLabel: TIER_LABEL[tier],
    multiplier: TIER_MULTIPLIER[tier],
    pointsBalance,
    axisBalance,
    walletBalance,
    referralCount,
    monthlyCap,
    usedThisMonth,
    capRemaining: Math.max(0, monthlyCap - usedThisMonth),
    isPrestige: tier === "AXIS_PRESTIGE",
  };
}

export async function getAgentEntitlements(userId: string) {
  const prisma = getPrisma();

  const agentProfile = await prisma.agentProfile.findUnique({ where: { userId } });
  if (!agentProfile) return null;

  const [cases, lines] = await Promise.all([
    prisma.case.count({ where: { agentId: agentProfile.id } }),
    prisma.commissionLineItem.findMany({ where: { recipientId: userId } }),
  ]);

  const lifetimeEarned = lines.reduce((sum, l) => sum + Number(l.amount), 0);
  const pending = lines.filter((l) => l.status === "PENDING").reduce((s, l) => s + Number(l.amount), 0);
  const paid = lines.filter((l) => l.status === "PAID").reduce((s, l) => s + Number(l.amount), 0);

  return { casesHandled: cases, lifetimeEarned, pending, paid, tierLabel: TIER_LABEL.AXIS_ONE, multiplier: TIER_MULTIPLIER.AXIS_ONE };
}

export async function getAgencyEntitlements(ownerId: string) {
  const prisma = getPrisma();

  const agency = await prisma.agency.findUnique({
    where: { ownerId },
    include: { agencyAgent: { where: { status: "ACTIVE" }, select: { userId: true } } },
  });
  if (!agency) return null;

  const rosterIds = [ownerId, ...agency.agencyAgent.map((a) => a.userId)];
  const lines = await prisma.commissionLineItem.findMany({ where: { recipientId: { in: rosterIds } } });
  const rosterVolume = lines.reduce((sum, l) => sum + Number(l.amount), 0);

  return {
    rosterSize: agency.agencyAgent.length,
    rosterVolume,
    tierLabel: TIER_LABEL.AXIS_PRO,
    multiplier: TIER_MULTIPLIER.AXIS_PRO,
  };
}

export async function getPrestigeEntitlements(userId: string) {
  const prisma = getPrisma();

  const node = await prisma.axisPrestigeNodeVesting.findFirst({ where: { userId } });
  if (!node) return null;

  const [realizedTotal, revenueShareAgg] = await Promise.all([
    getRealizedValueTotal(userId),
    prisma.walletLedgerEntry.aggregate({
      where: { userId, reason: "AXISPRESTIGE_REVENUE_SHARE" },
      _sum: { delta: true },
    }),
  ]);

  const vestedTokens = computeVestedTokens(
    {
      allocationTokens: Number(node.allocationTokens),
      verifiedAt: node.verifiedAt,
      cliffMonths: node.cliffMonths,
      vestingMonths: node.vestingMonths,
      performanceMultiplier: node.performanceMultiplier,
    },
    new Date()
  );

  const cliffEndsAt = new Date(node.verifiedAt.getTime() + node.cliffMonths * 30.44 * 24 * 60 * 60 * 1000);
  const inCliff = new Date() < cliffEndsAt;
  const cap = REALIZED_VALUE_CAP_MULTIPLE * NODE_PRICE_USD;

  return {
    allocationTokens: Number(node.allocationTokens),
    vestedTokens,
    performanceMultiplier: node.performanceMultiplier,
    burned: node.burned,
    inCliff,
    cliffEndsAt,
    realizedTotal,
    realizedCap: cap,
    revenueShareEarned: Number(revenueShareAgg._sum.delta ?? 0),
  };
}

export async function getAdminPlatformMetrics() {
  const prisma = getPrisma();

  const [
    usersByRole,
    commissionAgg,
    axisMiningAgg,
    axisPrestigeAgg,
    kycPending,
    casesSubmitted,
    miningPending,
    disputesOpen,
    topUpsPending,
    nodeClaimsPending,
    snapshot,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.commissionLineItem.aggregate({ _sum: { amount: true } }),
    prisma.axisVestingLedgerEntry.aggregate({ where: { source: "AGENT2MINE_TASK" }, _sum: { delta: true } }),
    prisma.axisVestingLedgerEntry.aggregate({ where: { source: "AXISPRESTIGE_VESTING" }, _sum: { delta: true } }),
    prisma.kycSubmission.count({ where: { status: "PENDING" } }),
    prisma.case.count({ where: { status: "SUBMITTED" } }),
    prisma.axisMiningSubmission.count({ where: { status: { in: ["PENDING", "FLAGGED_DUPLICATE"] } } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.walletTopUpRequest.count({ where: { status: "PENDING" } }),
    prisma.nftHolding.count({ where: { tier: "AXIS_PRESTIGE", verificationStatus: "PENDING" } }),
    getEmissionSnapshot(),
  ]);

  const roleCounts = Object.fromEntries(usersByRole.map((r) => [r.role, r._count])) as Record<string, number>;

  return {
    roleCounts,
    totalCommissionVolume: Number(commissionAgg._sum.amount ?? 0),
    totalAxisMined: Number(axisMiningAgg._sum.delta ?? 0),
    totalAxisVested: Number(axisPrestigeAgg._sum.delta ?? 0),
    poolRemaining: snapshot?.remainingPool ?? 0,
    pending: {
      kyc: kycPending,
      cases: casesSubmitted,
      mining: miningPending,
      disputes: disputesOpen,
      topUps: topUpsPending,
      nodeClaims: nodeClaimsPending,
    },
  };
}
