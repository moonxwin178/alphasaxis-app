"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { getWalletBalance } from "@/lib/wallet";
import { TIER_MULTIPLIER } from "@/lib/commission";
import { MEMBERSHIP_PRICE_USDT, REFERRAL_COMMISSION_RATE } from "@/lib/membership";
import type { NftTier, PrismaClient, Role } from "@/generated/prisma/client";

export type RoleAppFormState = { error?: string } | undefined;

const TIER_FOR_ROLE: Record<"AGENT" | "AGENCY", NftTier> = {
  AGENT: "AXIS_ONE",
  AGENCY: "AXIS_PRO",
};

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Grants the role + its identity NFT, and records the Tier 1 (10%) / Tier 2
 * (5%) USDT referral commissions on the mint price. The membership fee itself
 * is deducted from the in-app wallet balance separately, at the call site —
 * this only handles what happens once payment is confirmed.
 */
async function grantMembership(tx: Tx, userId: string, role: "AGENT" | "AGENCY", agencyName: string | null) {
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

  const buyer = await tx.user.findUnique({ where: { id: userId }, select: { referredById: true } });
  const mintPrice = MEMBERSHIP_PRICE_USDT[role];

  if (buyer?.referredById) {
    await tx.membershipCommission.create({
      data: {
        recipientId: buyer.referredById,
        sourceUserId: userId,
        mintedRole: role as Role,
        tier: "TIER_1",
        usdtAmount: mintPrice * REFERRAL_COMMISSION_RATE.TIER_1,
      },
    });

    const tier1 = await tx.user.findUnique({ where: { id: buyer.referredById }, select: { referredById: true } });
    if (tier1?.referredById) {
      await tx.membershipCommission.create({
        data: {
          recipientId: tier1.referredById,
          sourceUserId: userId,
          mintedRole: role as Role,
          tier: "TIER_2",
          usdtAmount: mintPrice * REFERRAL_COMMISSION_RATE.TIER_2,
        },
      });
    }
  }
}

export async function applyForRole(
  _prevState: RoleAppFormState,
  formData: FormData
): Promise<RoleAppFormState> {
  const user = await requireUser();
  const requestedRole = String(formData.get("requestedRole") ?? "");
  const agencyName = String(formData.get("agencyName") ?? "").trim().slice(0, 120);

  if (requestedRole !== "AGENT" && requestedRole !== "AGENCY") {
    return { error: "Invalid role requested." };
  }
  if (requestedRole === "AGENCY" && agencyName.length < 2) {
    return { error: "Please enter your agency name." };
  }

  const prisma = getPrisma();

  const existing = await prisma.roleApplication.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (existing) return { error: "You already have a pending application." };

  const price = MEMBERSHIP_PRICE_USDT[requestedRole];
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
