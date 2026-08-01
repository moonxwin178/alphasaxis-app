import "server-only";
import { getPrisma } from "./prisma";
import { getLiquidAxisBalance } from "./axisClaimVesting";
import { REFERRAL_COMMISSION_RATE } from "./membership";
import { MINT_PRICE_AXIS } from "./mintPricing";
import type { Role } from "@/generated/prisma/client";

export { MINT_PRICE_AXIS } from "./mintPricing";

/**
 * $AXIS mint-cycling — confirmed design. Users can pay the Agent/Agency
 * mint fee in $AXIS instead of USDT, priced at the same $0.0005 anchor the
 * whole Agent2Mine pool is denominated in. Referral on this path is paid
 * IN $AXIS (same 10%/5% tier structure as the USDT path), so the value
 * never leaves the ecosystem. The remainder splits 42.5% burned (destroyed
 * forever) / 42.5% into the $AXIS Liquidity Reserve — this is the real
 * anti-dump sink: every mint-cycled token either gets destroyed or stays
 * circulating internally, never becomes new sell-pressure float.
 */
const BURN_SHARE = 0.425;
const RESERVE_SHARE = 0.425;

export interface MintCyclePaymentResult {
  ok: boolean;
  error?: string;
}

/**
 * Deducts the $AXIS mint price from the payer, pays referrers in $AXIS,
 * and logs the burn/reserve/referral split for audit. Call this BEFORE
 * granting the role/NFT — if it fails (insufficient balance), the mint
 * shouldn't proceed.
 */
export async function payMintWithAxis(userId: string, role: "AGENT" | "AGENCY"): Promise<MintCyclePaymentResult> {
  const prisma = getPrisma();
  const price = MINT_PRICE_AXIS[role];

  const balance = await getLiquidAxisBalance(userId);
  if (balance < price) {
    return { ok: false, error: `You need ${price.toLocaleString()} liquid $AXIS to mint this way. You have ${balance.toLocaleString()} vested — lock more of your claimable balance at /earn/mine to build it up.` };
  }

  const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { referredById: true } });

  let referralPaid = 0;
  const referralOps: { recipientId: string; amount: number; tier: "REFERRAL_TIER_1" | "REFERRAL_TIER_2" }[] = [];

  if (buyer?.referredById) {
    const tier1Amount = price * REFERRAL_COMMISSION_RATE.TIER_1;
    referralPaid += tier1Amount;
    referralOps.push({ recipientId: buyer.referredById, amount: tier1Amount, tier: "REFERRAL_TIER_1" });

    const tier1 = await prisma.user.findUnique({ where: { id: buyer.referredById }, select: { referredById: true } });
    if (tier1?.referredById) {
      const tier2Amount = price * REFERRAL_COMMISSION_RATE.TIER_2;
      referralPaid += tier2Amount;
      referralOps.push({ recipientId: tier1.referredById, amount: tier2Amount, tier: "REFERRAL_TIER_2" });
    }
  }

  const netAfterReferral = price - referralPaid;
  const burnAmount = netAfterReferral * BURN_SHARE;
  const reserveAmount = netAfterReferral * RESERVE_SHARE;

  await prisma.$transaction([
    prisma.axisVestingLedgerEntry.create({
      data: { userId, delta: -price, source: "MINT_CYCLE_PAYMENT", refId: role },
    }),
    ...referralOps.map((r) =>
      prisma.axisVestingLedgerEntry.create({
        data: { userId: r.recipientId, delta: r.amount, source: "MINT_CYCLE_REFERRAL", refId: userId },
      })
    ),
    prisma.mintCycleLedgerEntry.create({
      data: { userId, role: role as Role, target: "BURN", amountAxis: burnAmount },
    }),
    prisma.mintCycleLedgerEntry.create({
      data: { userId, role: role as Role, target: "AXIS_LIQUIDITY_RESERVE", amountAxis: reserveAmount },
    }),
    ...referralOps.map((r) =>
      prisma.mintCycleLedgerEntry.create({
        data: { userId, role: role as Role, target: r.tier, amountAxis: r.amount, recipientId: r.recipientId },
      })
    ),
  ]);

  return { ok: true };
}

export async function getAxisLiquidityReserveBalance(): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.mintCycleLedgerEntry.aggregate({
    where: { target: "AXIS_LIQUIDITY_RESERVE" },
    _sum: { amountAxis: true },
  });
  return Number(result._sum.amountAxis ?? 0);
}

export async function getTotalAxisBurned(): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.mintCycleLedgerEntry.aggregate({
    where: { target: "BURN" },
    _sum: { amountAxis: true },
  });
  return Number(result._sum.amountAxis ?? 0);
}
