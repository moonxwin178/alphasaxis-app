"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { computeCommission, TIER_MULTIPLIER } from "@/lib/commission";
import type { NftTier } from "@/generated/prisma/client";

export type AdminFormState = { error?: string } | undefined;

function bestTier(tiers: NftTier[]): NftTier | null {
  if (tiers.length === 0) return null;
  return tiers.reduce((best, t) => (TIER_MULTIPLIER[t] > TIER_MULTIPLIER[best] ? t : best));
}

export async function assignAgentToCase(caseId: string, agentProfileId: string): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const [theCase, agentProfile] = await Promise.all([
    prisma.case.findUnique({ where: { id: caseId } }),
    prisma.agentProfile.findUnique({ where: { id: agentProfileId }, include: { user: { include: { nftHoldings: true } } } }),
  ]);

  if (!theCase) return { error: "Case not found." };
  if (!agentProfile) return { error: "Agent not found." };

  const tier = bestTier(agentProfile.user.nftHoldings.map((h) => h.tier));
  const commissionAmount = computeCommission(Number(theCase.amount), theCase.financingType, tier);

  await prisma.$transaction([
    prisma.case.update({
      where: { id: caseId },
      data: { agentId: agentProfile.id, status: "ASSIGNED" },
    }),
    prisma.caseEvent.create({
      data: { caseId, type: "AGENT_ASSIGNED", note: `Agent assigned — ${agentProfile.user.name}` },
    }),
    prisma.commission.create({
      data: {
        caseId,
        agentId: agentProfile.id,
        agencyId: agentProfile.agencyId,
        amount: commissionAmount,
      },
    }),
  ]);

  revalidatePath("/admin/cases");
  revalidatePath("/agent/pipeline");
  return undefined;
}

export async function reviewKyc(kycSubmissionId: string, approve: boolean): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  await prisma.kycSubmission.update({
    where: { id: kycSubmissionId },
    data: {
      status: approve ? "VERIFIED" : "MISMATCH",
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/users");
  return undefined;
}

export async function approveCommission(commissionId: string): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  await prisma.commission.update({
    where: { id: commissionId },
    data: { status: "APPROVED", approvedById: admin.id },
  });

  revalidatePath("/admin/payouts");
  return undefined;
}

export async function approveAllPendingCommissions(): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  await prisma.commission.updateMany({
    where: { status: "PENDING" },
    data: { status: "APPROVED", approvedById: admin.id },
  });

  revalidatePath("/admin/payouts");
  return undefined;
}

export async function resolveDispute(disputeId: string, note: string): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: "RESOLVED", resolutionNote: note || null, resolvedById: admin.id },
  });

  revalidatePath("/admin/disputes");
  return undefined;
}

export async function reviewCase(caseId: string, action: "approve" | "flag"): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  await prisma.$transaction([
    prisma.case.update({
      where: { id: caseId },
      data: { status: action === "approve" ? "APPROVED" : "FLAGGED" },
    }),
    prisma.caseEvent.create({
      data: {
        caseId,
        type: action === "approve" ? "ADMIN_APPROVED" : "ADMIN_FLAGGED",
        note: action === "approve" ? "Case approved by admin" : "Case flagged by admin",
      },
    }),
  ]);

  revalidatePath("/admin/cases");
  return undefined;
}
