"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { getWalletBalance } from "@/lib/wallet";
import { TIER_MULTIPLIER } from "@/lib/commission";
import { MEMBERSHIP_PRICE_USDT, REFERRAL_COMMISSION_RATE } from "@/lib/membership";
import { MINT_FEE_LIQUIDITY_SHARE } from "@/lib/liquidityReserve";
import { payMintWithAxis, MINT_PRICE_AXIS } from "@/lib/mintCycle";
import { getLiquidAxisBalance } from "@/lib/axisClaimVesting";
import type { NftTier, PrismaClient, Role } from "@/generated/prisma/client";

export type RoleAppFormState = { error?: string; agentActivated?: boolean } | undefined;

const TIER_FOR_ROLE: Record<"AGENT" | "AGENCY", NftTier> = {
  AGENT: "AXIS_ONE",
  AGENCY: "AXIS_PRO",
};

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/** Just the role/profile/NFT grant — no payment or referral logic. Shared by both payment paths. */
async function grantMembershipCore(tx: Tx, userId: string, role: "AGENT" | "AGENCY", agencyName: string | null) {
  await tx.user.update({ where: { id: userId }, data: { role: role as Role } });

  if (role === "AGENT") {
    const existingProfile = await tx.agentProfile.findUnique({ where: { userId } });
    if (!existingProfile) await tx.agentProfile.create({ data: { userId } });
  } else {
    const existingAgency = await tx.agency.findUnique({ where: { ownerId: userId } });
    if (!existingAgency) {
      await tx.agency.create({ data: { name: agencyName ?? "Unnamed Agency", ownerId: userId } });
    }
  }

  const tier = TIER_FOR_ROLE[role];
  const existingHolding = await tx.nftHolding.findFirst({ where: { userId, tier } });
  if (!existingHolding) {
    await tx.nftHolding.create({ data: { userId, tier, multiplier: TIER_MULTIPLIER[tier] } });
  }
}

/**
 * Grants the role + its identity NFT, and records the Tier 1 (10%) / Tier 2
 * (5%) USDT referral commissions on the mint price. The membership fee itself
 * is deducted from the in-app wallet balance separately, at the call site —
 * this only handles what happens once payment is confirmed. USDT path only —
 * the $AXIS mint-cycling path (see payMintWithAxis) handles its own referral
 * payout in $AXIS instead, since burning tokens can't be refunded the way a
 * USDT wallet deduction can.
 */
async function grantMembership(tx: Tx, userId: string, role: "AGENT" | "AGENCY", agencyName: string | null) {
  await grantMembershipCore(tx, userId, role, agencyName);

  const buyer = await tx.user.findUnique({ where: { id: userId }, select: { referredById: true } });
  const mintPrice = MEMBERSHIP_PRICE_USDT[role];
  let referralPaid = 0;

  if (buyer?.referredById) {
    const tier1Amount = mintPrice * REFERRAL_COMMISSION_RATE.TIER_1;
    referralPaid += tier1Amount;
    await tx.membershipCommission.create({
      data: {
        recipientId: buyer.referredById,
        sourceUserId: userId,
        mintedRole: role as Role,
        tier: "TIER_1",
        usdtAmount: tier1Amount,
      },
    });

    const tier1 = await tx.user.findUnique({ where: { id: buyer.referredById }, select: { referredById: true } });
    if (tier1?.referredById) {
      const tier2Amount = mintPrice * REFERRAL_COMMISSION_RATE.TIER_2;
      referralPaid += tier2Amount;
      await tx.membershipCommission.create({
        data: {
          recipientId: tier1.referredById,
          sourceUserId: userId,
          mintedRole: role as Role,
          tier: "TIER_2",
          usdtAmount: tier2Amount,
        },
      });
    }
  }

  const netFee = mintPrice - referralPaid;
  const liquidityContribution = netFee * MINT_FEE_LIQUIDITY_SHARE;
  if (liquidityContribution > 0) {
    await tx.liquidityReserveEntry.create({
      data: {
        amountUsd: liquidityContribution,
        source: "MINT_FEE_ALLOCATION",
        refId: userId,
        note: `${MINT_FEE_LIQUIDITY_SHARE * 100}% of net ${role} mint fee`,
      },
    });
  }

  return { mintPrice, referralPaid };
}

export async function applyForRole(
  _prevState: RoleAppFormState,
  formData: FormData
): Promise<RoleAppFormState> {
  const user = await requireUser();
  const requestedRole = String(formData.get("requestedRole") ?? "");
  const agencyName = String(formData.get("agencyName") ?? "").trim().slice(0, 120);
  const paymentMethod = String(formData.get("paymentMethod") ?? "WALLET");

  if (requestedRole !== "AGENT" && requestedRole !== "AGENCY") {
    return { error: "Invalid role requested." };
  }
  if (requestedRole === "AGENCY" && agencyName.length < 2) {
    return { error: "Please enter your agency name." };
  }
  if (paymentMethod !== "WALLET" && paymentMethod !== "AXIS") {
    return { error: "Invalid payment method." };
  }

  const prisma = getPrisma();

  const existing = await prisma.roleApplication.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (existing) return { error: "You already have a pending application." };

  const price = MEMBERSHIP_PRICE_USDT[requestedRole];

  if (paymentMethod === "AXIS") {
    // $AXIS mint-cycling path — burning tokens can't be refunded the way a
    // USDT deduction can, so for Agency (admin-gated) the actual $AXIS
    // payment is deferred to approval time, not committed at application
    // time. Agent stays instant since it's ungated either way.
    if (requestedRole === "AGENT") {
      const payment = await payMintWithAxis(user.id, "AGENT");
      if (!payment.ok) return { error: payment.error };

      await prisma.$transaction(async (tx) => {
        await tx.roleApplication.create({
          data: {
            userId: user.id,
            requestedRole: "AGENT",
            paymentMethod: "AXIS",
            status: "APPROVED",
            reviewedAt: new Date(),
          },
        });
        await grantMembershipCore(tx, user.id, "AGENT", null);
      });
      revalidatePath("/profile");
      revalidatePath("/wallet");
      return { agentActivated: true };
    } else {
      const balance = await getLiquidAxisBalance(user.id);
      if (balance < MINT_PRICE_AXIS.AGENCY) {
        return { error: `You need ${MINT_PRICE_AXIS.AGENCY.toLocaleString()} $AXIS. You have ${balance.toLocaleString()}.` };
      }
      await prisma.roleApplication.create({
        data: { userId: user.id, requestedRole: "AGENCY", agencyName, paymentMethod: "AXIS" },
      });
    }
  } else {
    const balance = await getWalletBalance(user.id);
    if (balance < price) {
      return { error: `You need $${price.toLocaleString()} in your wallet. Top up and try again.` };
    }

    if (requestedRole === "AGENT") {
      // Deducted and activated instantly — no admin gate.
      await prisma.$transaction(async (tx) => {
        const application = await tx.roleApplication.create({
          data: { userId: user.id, requestedRole: "AGENT", status: "APPROVED", reviewedAt: new Date() },
        });
        await tx.walletLedgerEntry.create({
          data: { userId: user.id, delta: -price, reason: "AGENT_MEMBERSHIP", refId: application.id },
        });
        await grantMembership(tx, user.id, "AGENT", null);
      });
      revalidatePath("/profile");
      revalidatePath("/wallet");
      return { agentActivated: true };
    } else {
      // Fee is committed now; refunded automatically if an admin rejects.
      await prisma.$transaction(async (tx) => {
        const application = await tx.roleApplication.create({
          data: { userId: user.id, requestedRole: "AGENCY", agencyName },
        });
        await tx.walletLedgerEntry.create({
          data: { userId: user.id, delta: -price, reason: "AGENCY_MEMBERSHIP", refId: application.id },
        });
      });
    }
  }

  revalidatePath("/profile");
  revalidatePath("/wallet");
  return undefined;
}

export async function reviewRoleApplication(applicationId: string, approve: boolean): Promise<RoleAppFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  const application = await prisma.roleApplication.findUnique({ where: { id: applicationId } });
  if (!application || application.status !== "PENDING") return { error: "Application not found or already reviewed." };

  if (!approve) {
    // Nothing was ever deducted for the $AXIS path at application time
    // (deferred to approval, see applyForRole), so there's nothing to
    // refund there — only the WALLET path commits a fee upfront.
    if (application.paymentMethod === "AXIS") {
      await prisma.roleApplication.update({
        where: { id: applicationId },
        data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date() },
      });
      revalidatePath("/admin/users");
      return undefined;
    }

    const price = MEMBERSHIP_PRICE_USDT[application.requestedRole as "AGENT" | "AGENCY"];
    await prisma.$transaction([
      prisma.roleApplication.update({
        where: { id: applicationId },
        data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date() },
      }),
      prisma.walletLedgerEntry.create({
        data: {
          userId: application.userId,
          delta: price,
          reason: "AGENCY_MEMBERSHIP_REFUND",
          refId: application.id,
        },
      }),
    ]);
    revalidatePath("/admin/users");
    revalidatePath("/wallet");
    return undefined;
  }

  if (application.paymentMethod === "AXIS") {
    const payment = await payMintWithAxis(application.userId, application.requestedRole as "AGENT" | "AGENCY");
    if (!payment.ok) return { error: payment.error };

    await prisma.$transaction(async (tx) => {
      await tx.roleApplication.update({
        where: { id: applicationId },
        data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
      });
      await grantMembershipCore(
        tx,
        application.userId,
        application.requestedRole as "AGENT" | "AGENCY",
        application.agencyName
      );
    });
    revalidatePath("/admin/users");
    return undefined;
  }

  await prisma.$transaction(async (tx) => {
    await tx.roleApplication.update({
      where: { id: applicationId },
      data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
    });
    await grantMembership(
      tx,
      application.userId,
      application.requestedRole as "AGENT" | "AGENCY",
      application.agencyName
    );
  });

  revalidatePath("/admin/users");
  return undefined;
}
