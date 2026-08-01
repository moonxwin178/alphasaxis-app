"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { computeCommissionDistribution } from "@/lib/commissionEngine";
import { resolveBrokerageTier, resolveUplineRecipientId } from "@/lib/commissionResolve";
import { sendNotificationEmail } from "@/lib/email";
import { generateUniqueReferralCode } from "@/lib/referral";
import { createConsultantInviteToken } from "@/lib/inviteToken";
import { EMAIL_PATTERN, stripControlChars } from "@/lib/apiSecurity";

export type AdminFormState = { error?: string } | undefined;

/**
 * Loan Consultants don't self-register — an admin creates the account and
 * the consultant claims it via a signed, time-boxed invite link that lets
 * them set their own password. We never generate or email a plaintext
 * password.
 */
export async function inviteLoanConsultant(name: string, email: string): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const cleanName = stripControlChars(name).slice(0, 100);
  const cleanEmail = email.trim().toLowerCase();

  if (cleanName.length < 2) return { error: "Please enter a full name." };
  if (!EMAIL_PATTERN.test(cleanEmail)) return { error: "Please enter a valid email." };

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) return { error: "An account with this email already exists." };

  const unusablePasswordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
  const referralCode = await generateUniqueReferralCode();

  const consultant = await prisma.user.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      passwordHash: unusablePasswordHash,
      referralCode,
      role: "LOAN_CONSULTANT",
    },
  });

  const token = await createConsultantInviteToken(consultant.id);
  await sendNotificationEmail(
    cleanEmail,
    "You're invited as a Loan Consultant — AlphasAxis",
    `<p>Hi ${cleanName},</p><p>You've been added as a Loan Consultant on AlphasAxis. Set your password to activate your account:</p><p><a href="https://app.alphasaxis.com/consultant-invite?token=${token}">app.alphasaxis.com/consultant-invite?token=${token}</a></p><p>This link expires in 7 days.</p>`
  );

  revalidatePath("/admin/users");
  return undefined;
}

export async function assignAgentToCase(caseId: string, agentProfileId: string): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const [theCase, agentProfile] = await Promise.all([
    prisma.case.findUnique({ where: { id: caseId } }),
    prisma.agentProfile.findUnique({ where: { id: agentProfileId }, include: { user: { select: { id: true, name: true } } } }),
  ]);

  if (!theCase) return { error: "Case not found." };
  if (!agentProfile) return { error: "Agent not found." };

  // Snapshotted now, not recomputed at disbursement — an NFT upgrade after
  // this point doesn't retroactively change this deal's split.
  const introducerTier = await resolveBrokerageTier(agentProfile.user.id);

  await prisma.$transaction([
    prisma.case.update({
      where: { id: caseId },
      data: { agentId: agentProfile.id, status: "ASSIGNED", introducerTier },
    }),
    prisma.caseEvent.create({
      data: { caseId, type: "AGENT_ASSIGNED", note: `Agent assigned — ${agentProfile.user.name}` },
    }),
  ]);

  revalidatePath("/admin/cases");
  revalidatePath("/agent/pipeline");
  return undefined;
}

/**
 * Sets whether the introducing agent is servicing the case themselves, or
 * needs an internal Loan Consultant. This isn't just a workflow label — it
 * directly determines isSelfClosed in the commission engine, so it has to
 * be locked in before disbursement, not inferred afterward.
 */
export async function setCaseServicing(
  caseId: string,
  mode: "SELF_SERVICED" | "NEEDS_CONSULTANT",
  consultantId?: string
): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  if (mode === "NEEDS_CONSULTANT") {
    if (!consultantId) return { error: "Pick a loan consultant." };
    const consultant = await prisma.user.findUnique({ where: { id: consultantId } });
    if (!consultant || consultant.role !== "LOAN_CONSULTANT") return { error: "Not a valid loan consultant." };

    await prisma.$transaction([
      prisma.case.update({ where: { id: caseId }, data: { servicingMode: mode, consultantId } }),
      prisma.caseEvent.create({
        data: { caseId, type: "CONSULTANT_ASSIGNED", note: `Loan consultant assigned — ${consultant.name}` },
      }),
    ]);

    const theCase = await prisma.case.findUnique({ where: { id: caseId }, include: { applicant: { select: { name: true } } } });
    await sendNotificationEmail(
      consultant.email,
      "New case assigned to you — AlphasAxis",
      `<p>Hi ${consultant.name},</p><p>You've been assigned a case for <strong>${theCase?.applicant.name ?? "a client"}</strong> (Case #${caseId.slice(0, 8).toUpperCase()}).</p><p>Log in to review the details and follow up: <a href="https://app.alphasaxis.com/consultant/pipeline">app.alphasaxis.com/consultant/pipeline</a></p>`
    );
  } else {
    await prisma.$transaction([
      prisma.case.update({ where: { id: caseId }, data: { servicingMode: mode, consultantId: null } }),
      prisma.caseEvent.create({ data: { caseId, type: "SELF_SERVICED", note: "Agent self-servicing this case" } }),
    ]);
  }

  revalidatePath("/admin/cases");
  revalidatePath("/consultant/pipeline");
  return undefined;
}

/**
 * The real trigger. Only runs once a case is APPROVED and its servicing
 * mode is decided. Computes the full multi-party split off the real gross
 * commission and persists one CommissionLineItem per party, plus the
 * Treasury gap (if any) — see src/lib/commissionEngine.ts.
 */
export async function disburseCase(caseId: string, grossCommission: number): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  if (!Number.isFinite(grossCommission) || grossCommission <= 0) {
    return { error: "Enter a valid gross commission amount." };
  }

  const theCase = await prisma.case.findUnique({
    where: { id: caseId },
    include: { agent: { include: { user: true } } },
  });

  if (!theCase) return { error: "Case not found." };
  if (theCase.status !== "APPROVED") return { error: "Case must be approved before disbursement." };
  if (!theCase.agent || !theCase.introducerTier) return { error: "Case has no assigned agent." };
  if (theCase.servicingMode === "UNDECIDED") return { error: "Decide self-serviced vs. loan consultant first." };

  const introducerId = theCase.agent.user.id;
  const isSelf = theCase.servicingMode === "SELF_SERVICED";
  const callerAndCloserId = isSelf ? introducerId : (theCase.consultantId ?? introducerId);
  const uplineRecipientId = await resolveUplineRecipientId(introducerId);

  const result = computeCommissionDistribution({
    grossCommission,
    introducerTier: theCase.introducerTier,
    leadProviderId: introducerId,
    callerId: callerAndCloserId,
    closerId: callerAndCloserId,
    uplineRecipientId,
  });

  await prisma.$transaction([
    prisma.case.update({
      where: { id: caseId },
      data: { status: "DISBURSED", grossCommission },
    }),
    prisma.caseEvent.create({
      data: { caseId, type: "DISBURSED", note: `Disbursed — gross commission RM${grossCommission.toLocaleString()}` },
    }),
    ...result.lineItems
      .filter((l) => l.role !== "TREASURY")
      .map((l) =>
        prisma.commissionLineItem.create({
          data: { caseId, role: l.role, recipientId: l.recipientId, amount: l.amount },
        })
      ),
    ...(result.treasuryShare > 0
      ? [prisma.treasuryLedgerEntry.create({ data: { caseId, amount: result.treasuryShare } })]
      : []),
  ]);

  revalidatePath("/admin/cases");
  revalidatePath("/admin/payouts");
  revalidatePath("/agent/pipeline");
  revalidatePath("/consultant/pipeline");
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

export async function approveCommission(lineItemId: string): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  await prisma.commissionLineItem.update({
    where: { id: lineItemId },
    data: { status: "APPROVED", approvedById: admin.id },
  });

  revalidatePath("/admin/payouts");
  return undefined;
}

export async function approveAllPendingCommissions(): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  await prisma.commissionLineItem.updateMany({
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
