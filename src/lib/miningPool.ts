import "server-only";
import { getPrisma } from "./prisma";
import { getEmissionSnapshot } from "./axisEmission";
import { getMiningPowerMultiplier } from "./miningPowerMultiplier";
import { resolveMiningTier } from "./commissionResolve";
import { TIER_QUOTA, type TierQuota } from "./miningQuota";
import type { AxisMiningTaskType } from "@/generated/prisma/client";

/** Current unmined backlog — a permanent claim, no expiry, only extractable by completing tasks. */
export async function getMiningPoolBalance(userId: string): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.miningPoolLedgerEntry.aggregate({ where: { userId }, _sum: { delta: true } });
  return Number(result._sum.delta ?? 0);
}

function startOfWeek(now: Date): Date {
  const d = new Date(now);
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(now: Date): Date {
  const d = new Date(now);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Checks a proposed deposit against the fixed, tier-scaled RM quota (see
 * miningQuota.ts) — the simple, transparent throttle on how much real-world
 * spend can enter the pool. Exceeding a period's quota rejects outright;
 * there's no rollover or queueing to the next period.
 */
export async function checkDepositQuota(
  userId: string,
  category: AxisMiningTaskType,
  depositValueRm: number,
  now: Date = new Date()
): Promise<{ ok: true } | { ok: false; error: string }> {
  const prisma = getPrisma();
  const tier = await resolveMiningTier(userId);
  const quota: TierQuota = TIER_QUOTA[tier];

  const field = category === "PETROL_RECEIPT" ? "subsidyAmountRm" : "adSpendRm";
  const weeklyLimit = category === "PETROL_RECEIPT" ? quota.petrolWeeklyRm : quota.adsWeeklyRm;
  const monthlyLimit = category === "PETROL_RECEIPT" ? quota.petrolMonthlyRm : quota.adsMonthlyRm;

  const [weekAgg, monthAgg] = await Promise.all([
    prisma.axisMiningSubmission.aggregate({
      where: { userId, taskType: category, status: "APPROVED", createdAt: { gte: startOfWeek(now) } },
      _sum: { [field]: true },
    }),
    prisma.axisMiningSubmission.aggregate({
      where: { userId, taskType: category, status: "APPROVED", createdAt: { gte: startOfMonth(now) } },
      _sum: { [field]: true },
    }),
  ]);

  const weekUsed = Number((weekAgg._sum as Record<string, unknown>)[field] ?? 0);
  const monthUsed = Number((monthAgg._sum as Record<string, unknown>)[field] ?? 0);

  if (weekUsed + depositValueRm > weeklyLimit) {
    return { ok: false, error: `Weekly quota reached (RM${weeklyLimit} max) — try again next week.` };
  }
  if (monthUsed + depositValueRm > monthlyLimit) {
    return { ok: false, error: `Monthly quota reached (RM${monthlyLimit} max) — try again next month.` };
  }
  return { ok: true };
}

/** Credits the deposit into the user's personal backlog pool. Deposits are uncapped in size beyond the quota check above — they cost the pool nothing until actually mined out. */
export async function depositToPool(userId: string, amountAxis: number, refId: string): Promise<void> {
  const prisma = getPrisma();
  await prisma.miningPoolLedgerEntry.create({
    data: { userId, delta: amountAxis, source: "DEPOSIT", refId },
  });
}

const MONTHLY_TO_WEEKLY_RATE = 0.30;
const MONTHLY_TO_YEARLY_MULTIPLE = 10;

/**
 * The task-triggered mine-out step — call this after any qualifying task
 * completion (check-in, social task, submit-to-earn milestone, etc.).
 * Withdraws up to (monthly cap ÷ 30) from the user's backlog, clamped by
 * whatever's actually in the pool and by the weekly/monthly/yearly ceiling
 * (tier + Mining Power Multiplier weighted). Silently no-ops if there's
 * nothing to mine or the cap is already maxed — never errors, since this is
 * meant to run invisibly alongside normal task actions.
 */
export async function mineOutForTask(userId: string): Promise<number> {
  const prisma = getPrisma();
  const now = new Date();

  const poolBalance = await getMiningPoolBalance(userId);
  if (poolBalance <= 0) return 0;

  const [tier, mpm, snapshot] = await Promise.all([
    resolveMiningTier(userId),
    getMiningPowerMultiplier(userId),
    getEmissionSnapshot(),
  ]);
  if (!snapshot) return 0;

  const monthlyCap = snapshot.capByTier[tier] * mpm;
  const weeklyCap = monthlyCap * MONTHLY_TO_WEEKLY_RATE;
  const yearlyCap = monthlyCap * MONTHLY_TO_YEARLY_MULTIPLE;
  const perTaskUnlock = monthlyCap / 30;

  const yearStart = new Date(now.getFullYear(), 0, 1);
  const [weekAgg, monthAgg, yearAgg] = await Promise.all([
    prisma.axisVestingLedgerEntry.aggregate({
      where: { userId, source: "AGENT2MINE_TASK", createdAt: { gte: startOfWeek(now) } },
      _sum: { delta: true },
    }),
    prisma.axisVestingLedgerEntry.aggregate({
      where: { userId, source: "AGENT2MINE_TASK", createdAt: { gte: startOfMonth(now) } },
      _sum: { delta: true },
    }),
    prisma.axisVestingLedgerEntry.aggregate({
      where: { userId, source: "AGENT2MINE_TASK", createdAt: { gte: yearStart } },
      _sum: { delta: true },
    }),
  ]);

  const remainingWeek = weeklyCap - Number(weekAgg._sum.delta ?? 0);
  const remainingMonth = monthlyCap - Number(monthAgg._sum.delta ?? 0);
  const remainingYear = yearlyCap - Number(yearAgg._sum.delta ?? 0);

  const amount = Math.max(0, Math.min(perTaskUnlock, poolBalance, remainingWeek, remainingMonth, remainingYear));
  if (amount <= 0) return 0;

  await prisma.$transaction([
    prisma.axisVestingLedgerEntry.create({ data: { userId, delta: amount, source: "AGENT2MINE_TASK" } }),
    prisma.miningPoolLedgerEntry.create({ data: { userId, delta: -amount, source: "TASK_MINEOUT" } }),
  ]);

  return amount;
}
