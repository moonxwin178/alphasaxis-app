import "server-only";
import { getPrisma } from "./prisma";
import { getMiningPowerMultiplier } from "./miningPowerMultiplier";
import type { VestingLockTier } from "@/generated/prisma/client";

/**
 * Universal vesting-lock for mine-out claims. Mining a task (see
 * mineOutForTask in miningPool.ts) only makes $AXIS *claimable* — it does
 * NOT count toward the spendable balance (see getLiquidAxisBalance). To
 * actually get spendable $AXIS, a user locks a slice of their claimable
 * balance into one of these four fixed terms; longer locks release a higher
 * % of the locked amount, and a user's current Mining Power Multiplier
 * boosts that % further (capped at 100% — never above 1:1).
 */
export const LOCK_TIER_CONFIG: Record<VestingLockTier, { months: number; basePayoutPct: number; label: string }> = {
  SIX_MONTH: { months: 6, basePayoutPct: 0.3, label: "6 months" },
  ONE_YEAR: { months: 12, basePayoutPct: 0.5, label: "1 year" },
  TWO_YEAR: { months: 24, basePayoutPct: 0.7, label: "2 years" },
  THREE_YEAR: { months: 36, basePayoutPct: 1.0, label: "3 years" },
};

const MS_PER_MONTH = 30.44 * 24 * 60 * 60 * 1000;

/** Mined via tasks but not yet locked into a vesting schedule — the pool a user can choose to lock. */
export async function getClaimableAxisBalance(userId: string): Promise<number> {
  const prisma = getPrisma();
  const [minedAgg, lockedAgg] = await Promise.all([
    prisma.axisVestingLedgerEntry.aggregate({ where: { userId, source: "AGENT2MINE_TASK" }, _sum: { delta: true } }),
    prisma.axisClaimVestingSchedule.aggregate({ where: { userId }, _sum: { grossAmount: true } }),
  ]);
  const mined = Number(minedAgg._sum.delta ?? 0);
  const locked = Number(lockedAgg._sum.grossAmount ?? 0);
  return Math.max(0, mined - locked);
}

/**
 * Actually spendable now — everything except raw claimable mining (which
 * only becomes spendable once locked and vested via CLAIM_VESTING_PAYOUT).
 */
export async function getLiquidAxisBalance(userId: string): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.axisVestingLedgerEntry.aggregate({
    where: { userId, NOT: { source: "AGENT2MINE_TASK" } },
    _sum: { delta: true },
  });
  return Number(result._sum.delta ?? 0);
}

export interface ClaimResult {
  ok: boolean;
  error?: string;
  payoutAmount?: number;
  effectivePayoutPct?: number;
}

export async function claimToVesting(userId: string, amount: number, lockTier: VestingLockTier): Promise<ClaimResult> {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter a valid amount." };

  const config = LOCK_TIER_CONFIG[lockTier];
  if (!config) return { ok: false, error: "Invalid lock term." };

  const claimable = await getClaimableAxisBalance(userId);
  if (amount > claimable) {
    return { ok: false, error: `You only have ${claimable.toLocaleString()} $AXIS claimable.` };
  }

  const prisma = getPrisma();
  const mpm = await getMiningPowerMultiplier(userId);
  const effectivePayoutPct = Math.min(1, config.basePayoutPct * mpm);
  const payoutAmount = amount * effectivePayoutPct;

  await prisma.axisClaimVestingSchedule.create({
    data: { userId, grossAmount: amount, payoutAmount, lockTier, lockMonths: config.months },
  });

  return { ok: true, payoutAmount, effectivePayoutPct };
}

function vestedPayoutToDate(schedule: { payoutAmount: number; lockMonths: number; startedAt: Date }, now: Date): number {
  const elapsedMonths = (now.getTime() - schedule.startedAt.getTime()) / MS_PER_MONTH;
  const fraction = Math.min(1, Math.max(0, elapsedMonths / schedule.lockMonths));
  return schedule.payoutAmount * fraction;
}

/** Releases newly-vested $AXIS from all of a user's active schedules into their liquid balance. Safe to call on every page load — idempotent, only ever credits the delta since the last run. */
export async function runClaimVestingBatch(userId: string): Promise<number> {
  const prisma = getPrisma();
  const schedules = await prisma.axisClaimVestingSchedule.findMany({ where: { userId } });
  const now = new Date();
  let totalReleased = 0;

  for (const s of schedules) {
    const vestedToDate = vestedPayoutToDate(
      { payoutAmount: Number(s.payoutAmount), lockMonths: s.lockMonths, startedAt: s.startedAt },
      now
    );
    const delta = vestedToDate - Number(s.cumulativeVested);
    if (delta <= 0) continue;

    await prisma.$transaction([
      prisma.axisVestingLedgerEntry.create({
        data: { userId, delta, source: "CLAIM_VESTING_PAYOUT", refId: s.id },
      }),
      prisma.axisClaimVestingSchedule.update({ where: { id: s.id }, data: { cumulativeVested: vestedToDate } }),
    ]);
    totalReleased += delta;
  }

  return totalReleased;
}

export interface ScheduleView {
  id: string;
  grossAmount: number;
  payoutAmount: number;
  lockTier: VestingLockTier;
  lockMonths: number;
  startedAt: Date;
  cumulativeVested: number;
  vestedToDate: number;
  fullyVested: boolean;
}

export async function getClaimVestingSchedules(userId: string): Promise<ScheduleView[]> {
  const prisma = getPrisma();
  const schedules = await prisma.axisClaimVestingSchedule.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();
  return schedules.map((s) => {
    const payoutAmount = Number(s.payoutAmount);
    const vestedToDate = vestedPayoutToDate({ payoutAmount, lockMonths: s.lockMonths, startedAt: s.startedAt }, now);
    return {
      id: s.id,
      grossAmount: Number(s.grossAmount),
      payoutAmount,
      lockTier: s.lockTier,
      lockMonths: s.lockMonths,
      startedAt: s.startedAt,
      cumulativeVested: Number(s.cumulativeVested),
      vestedToDate,
      fullyVested: vestedToDate >= payoutAmount,
    };
  });
}
