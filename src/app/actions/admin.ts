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
import { createInviteToken } from "@/lib/inviteToken";
import { EMAIL_PATTERN, stripControlChars } from "@/lib/apiSecurity";
import { getMiningConfig, rmToAxis } from "@/lib/miningConfig";
import { createNodeVesting, runVestingBatch } from "@/lib/axisPrestigeVesting";
import { contributeToPrestigePool, runRevenueDistribution } from "@/lib/axisPrestigeRevenue";
import { contributeNodeSaleShare } from "@/lib/liquidityReserve";
import { contributeAesRevenue, runAesNodePoolDistribution } from "@/lib/aesRevenue";
import type { AesRevenueTarget } from "@/generated/prisma/client";
import type { AxisRealizedValueSource } from "@/generated/prisma/client";

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

  const token = await createInviteToken(consultant.id, "consultant-invite");
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

/** Approving flips tier to ADVANCED, unlocking the higher deposit quota + earn-rate boost. */
export async function reviewKycAdvanced(kycSubmissionId: string, approve: boolean): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  await prisma.kycSubmission.update({
    where: { id: kycSubmissionId },
    data: {
      advancedStatus: approve ? "VERIFIED" : "MISMATCH",
      tier: approve ? "ADVANCED" : undefined,
      advancedReviewedById: admin.id,
      advancedReviewedAt: new Date(),
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

/**
 * Approves (or rejects) an Agent2Mine submission. On approval, the award is
 * clamped to the user's remaining PerUserMonthlyCap for this calendar month
 * — the sinking-fund emission model (src/lib/axisEmission.ts) exists
 * specifically so no single user can drain the pool faster than the
 * 60-month vesting horizon allows. requestedAmount lets the admin propose a
 * specific award (e.g. matching the actual subsidy/spend); it's silently
 * capped, never rejected outright, so admins don't need to pre-calculate
 * the exact cap themselves.
 */
/**
 * Approval deposits the submission's RM value into the user's personal
 * mining pool (the deposit-quota check already ran at submission time) —
 * it doesn't award $AXIS directly. The user only mines it out by completing
 * tasks, subject to the tier + Mining Power Multiplier weighted cap. See
 * src/lib/miningPool.ts.
 */
export async function reviewMiningSubmission(submissionId: string, action: "approve" | "reject"): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  const submission = await prisma.axisMiningSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) return { error: "Submission not found." };
  if (submission.status === "APPROVED" || submission.status === "REJECTED") {
    return { error: "This submission has already been reviewed." };
  }

  if (action === "reject") {
    await prisma.axisMiningSubmission.update({
      where: { id: submissionId },
      data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date() },
    });
    revalidatePath("/admin/mining");
    return undefined;
  }

  const depositValueRm = Number(submission.depositValueRm ?? 0);
  if (depositValueRm <= 0) return { error: "This submission has no deposit value recorded." };

  const config = await getMiningConfig();
  const axisDeposited = rmToAxis(depositValueRm, config.fxRateRmPerUsd);

  await prisma.$transaction([
    prisma.axisMiningSubmission.update({
      where: { id: submissionId },
      data: { status: "APPROVED", axisDeposited, reviewedById: admin.id, reviewedAt: new Date() },
    }),
    prisma.miningPoolLedgerEntry.create({
      data: { userId: submission.userId, delta: axisDeposited, source: "DEPOSIT", refId: submissionId },
    }),
  ]);

  revalidatePath("/admin/mining");
  return undefined;
}

/**
 * Runs one AxisPrestige quarterly distribution — split evenly across all
 * verified node holders. Intentionally a manual admin trigger, not a cron:
 * exact quarterly cadence/schedule and how much of the 32.04B Early Backers
 * pool to release each time are business decisions, not something to
 * automate without the user's sign-off (flagged in the delivery summary).
 */
/**
 * Approves (or rejects) a PENDING AxisPrestige node-wallet claim submitted
 * via submitNodeVerification (actions/nft.ts). Approval is what starts the
 * clock — it creates the node's vesting record (cliff begins now).
 */
/**
 * approvedNodeCount lets the admin verify/adjust the self-declared count
 * against what they can actually see on-chain (turbox.bond or a block
 * explorer — no live blockchain integration exists to read it
 * automatically) before approving. Multiple nodes create one NftHolding +
 * one AxisPrestigeNodeVesting row each (the vesting model requires a
 * unique nftHoldingId), all VERIFIED, same wallet — the 3x multiplier
 * stays flat per person regardless of how many.
 */
export async function reviewNodeVerification(
  nftHoldingId: string,
  approve: boolean,
  approvedNodeCount?: number
): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const holding = await prisma.nftHolding.findUnique({ where: { id: nftHoldingId } });
  if (!holding || holding.tier !== "AXIS_PRESTIGE") return { error: "Node claim not found." };
  if (holding.verificationStatus !== "PENDING") return { error: "This claim has already been reviewed." };

  if (!approve) {
    await prisma.nftHolding.update({ where: { id: nftHoldingId }, data: { verificationStatus: "REJECTED" } });
    revalidatePath("/admin/axisprestige");
    return undefined;
  }

  const nodeCount = Math.max(1, Math.floor(approvedNodeCount ?? holding.claimedNodeCount ?? 1));
  const verifiedAt = new Date();

  await prisma.nftHolding.update({
    where: { id: nftHoldingId },
    data: { verificationStatus: "VERIFIED", chain: "verified-manual", claimedNodeCount: nodeCount },
  });
  await createNodeVesting(nftHoldingId, holding.userId, verifiedAt);

  for (let i = 1; i < nodeCount; i++) {
    const extraHolding = await prisma.nftHolding.create({
      data: {
        userId: holding.userId,
        tier: "AXIS_PRESTIGE",
        multiplier: holding.multiplier,
        chain: "verified-manual",
        walletAddress: holding.walletAddress,
        verificationStatus: "VERIFIED",
      },
    });
    await createNodeVesting(extraHolding.id, holding.userId, verifiedAt);
  }

  revalidatePath("/admin/axisprestige");
  revalidatePath("/profile");
  return undefined;
}

/** Logs real revenue from an actual converted case (or a manual top-up) into the AxisPrestige revenue pool — the funding source for quarterly distributions. */
export async function contributeAxisPrestigeRevenue(
  amountUsd: number,
  caseId: string | null,
  note: string
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return { error: "Enter a valid contribution amount." };

  await contributeToPrestigePool(amountUsd, caseId || null, stripControlChars(note).slice(0, 200) || null, admin.id);
  revalidatePath("/admin/axisprestige");
  return undefined;
}

/** Distributes amountUsd from the accumulated pool evenly across verified nodes, paid to their in-app wallet. */
export async function runAxisPrestigeRevenueDistribution(
  label: string,
  amountUsd: number
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");

  const cleanLabel = stripControlChars(label).slice(0, 20);
  if (!cleanLabel) return { error: "Enter a quarter label (e.g. Q1 2027)." };
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return { error: "Enter a valid amount to distribute." };

  const result = await runRevenueDistribution(cleanLabel, amountUsd, admin.id);
  if ("error" in result) return { error: result.error };

  revalidatePath("/admin/axisprestige");
  return undefined;
}

/** Processes $AXIS token vesting for every active node — credits whatever has newly vested since the last run, checking the 25x burn cap first. */
export async function runAxisPrestigeVestingBatch(): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const lines = await runVestingBatch();
  if (lines.length > 0) {
    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    await prisma.axisPrestigeVestingRun.create({
      data: {
        label: new Date().toLocaleDateString(),
        totalCreditedTokens: total,
        lines: { create: lines.map((l) => ({ userId: l.userId, nftHoldingId: l.nftHoldingId, amount: l.amount })) },
      },
    });
  }

  revalidatePath("/admin/axisprestige");
  revalidatePath("/earn/mine");
  revalidatePath("/profile");
  return undefined;
}

/** Admin-editable "hash rate power" multiplier — ties Agent2Mine task performance to faster token vesting. Manual for now; see the flag on the exact auto-scoring formula. */
export async function setNodePerformanceMultiplier(nodeVestingId: string, multiplier: number): Promise<AdminFormState> {
  await requireRole("ADMIN");
  if (!Number.isFinite(multiplier) || multiplier <= 0) return { error: "Enter a valid multiplier." };

  const prisma = getPrisma();
  await prisma.axisPrestigeNodeVesting.update({
    where: { id: nodeVestingId },
    data: { performanceMultiplier: multiplier },
  });

  revalidatePath("/admin/axisprestige");
  return undefined;
}

/** Manually logs a realized-value event (token sale or marketplace redemption) — no real exchange/marketplace $AXIS integration exists yet, so an admin records it when they see evidence of it. Feeds the 25x burn cap alongside auto-logged revenue-share payouts. */
export async function recordRealizedValue(
  userId: string,
  amountUsd: number,
  source: Extract<AxisRealizedValueSource, "TOKEN_SALE" | "MARKETPLACE_REDEMPTION">,
  note: string
): Promise<AdminFormState> {
  await requireRole("ADMIN");
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return { error: "Enter a valid amount." };

  const prisma = getPrisma();
  await prisma.axisRealizedValueEntry.create({
    data: { userId, amountUsd, source, note: stripControlChars(note).slice(0, 200) || null },
  });

  revalidatePath("/admin/axisprestige");
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

/**
 * Logs a real-world AxisPrestige node-sale proceeds contribution to the
 * Liquidity Reserve. The $500/node sale happens off-platform on
 * turbox.bond, so there's no in-app payment to hook automatically — an
 * admin enters the actual figure once it's known (e.g. 10-15% of proceeds
 * from a completed sale round, per the confirmed plan).
 */
export async function logNodeSaleLiquidityContribution(amountUsd: number, note: string): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return { error: "Enter a valid amount." };

  await contributeNodeSaleShare(amountUsd, stripControlChars(note).slice(0, 200) || "Node sale liquidity contribution", admin.id);

  revalidatePath("/admin/axisprestige");
  return undefined;
}

/**
 * Logs a real AES net-revenue figure (the broader business, not just the
 * commission-engine's AES line item) and auto-computes all six target
 * splits: 1%/1%/1% to the three node pools, 3.5%/2.1%/1.4% to
 * buyback-burn/strategic-reserve/operations.
 */
export async function logAesRevenueContribution(aesNetRevenueUsd: number, note: string): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  if (!Number.isFinite(aesNetRevenueUsd) || aesNetRevenueUsd <= 0) return { error: "Enter a valid revenue figure." };

  await contributeAesRevenue(aesNetRevenueUsd, stripControlChars(note).slice(0, 200) || "AES revenue contribution", admin.id);

  revalidatePath("/admin/axisprestige");
  return undefined;
}

/** Distributes a node pool's accumulated balance to qualifying node holders (1+/5+/10+ nodes for Pool A/B/C). */
export async function runAesPoolDistribution(target: AesRevenueTarget): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  if (target !== "NODE_POOL_A" && target !== "NODE_POOL_B" && target !== "NODE_POOL_C") {
    return { error: "Invalid pool." };
  }

  const result = await runAesNodePoolDistribution(target, admin.id);
  if ("error" in result) return { error: result.error };

  revalidatePath("/admin/axisprestige");
  return undefined;
}

const PERCENT_FIELDS = [
  "petrolSubsidyRate",
  "mpmBonusPerTierWeight",
  "mpmCap",
  "adsDepositRate",
  "mintBurnShare",
  "mintReserveShare",
  "lockSixMonthPayoutPct",
  "lockOneYearPayoutPct",
  "lockTwoYearPayoutPct",
  "lockThreeYearPayoutPct",
] as const;

/**
 * Updates the single-row AxisMiningConfig — every tokenomics knob an admin
 * can tune post-launch without a code deploy. Percent fields arrive from
 * the form as whole numbers (e.g. "42.5" for 42.5%) and are stored as
 * fractions (0.425), matching how the rest of the codebase reads them.
 * Only ever affects NEW calculations — nothing here rewrites ledger rows
 * or vesting schedules already created under the prior numbers.
 */
export async function updateMiningConfig(_prevState: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const fxRateRmPerUsd = Number(formData.get("fxRateRmPerUsd"));
  const halvingMilestoneMiners = Number(formData.get("halvingMilestoneMiners"));

  if (!Number.isFinite(fxRateRmPerUsd) || fxRateRmPerUsd <= 0) return { error: "Enter a valid FX rate." };
  if (!Number.isInteger(halvingMilestoneMiners) || halvingMilestoneMiners <= 0) {
    return { error: "Halving milestone must be a positive whole number of miners." };
  }

  const percentValues: Record<(typeof PERCENT_FIELDS)[number], number> = {} as never;
  for (const field of PERCENT_FIELDS) {
    const raw = Number(formData.get(field));
    if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
      return { error: `Enter a valid percentage (0–100) for ${field}.` };
    }
    percentValues[field] = raw / 100;
  }

  const boostFields = ["advancedKycQuotaBoost", "advancedKycEarnBoost"] as const;
  const boostValues: Record<(typeof boostFields)[number], number> = {} as never;
  for (const field of boostFields) {
    const raw = Number(formData.get(field));
    if (!Number.isFinite(raw) || raw < 0) {
      return { error: `Enter a valid boost percentage for ${field}.` };
    }
    boostValues[field] = 1 + raw / 100;
  }

  const existing = await getMiningConfig();
  await prisma.axisMiningConfig.update({
    where: { id: existing.id },
    data: { fxRateRmPerUsd, halvingMilestoneMiners, ...percentValues, ...boostValues },
  });

  revalidatePath("/admin/mining");
  return undefined;
}
