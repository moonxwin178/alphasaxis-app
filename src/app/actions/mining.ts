"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { uploadPrivateFile } from "@/lib/blob";
import { computePerceptualHash, checkDuplicateReceipt } from "@/lib/receiptFraud";
import { stripControlChars } from "@/lib/apiSecurity";
import { isCountryAllowedForMining, ALLOWED_MINING_COUNTRIES } from "@/lib/regionGate";
import { checkDepositQuota } from "@/lib/miningPool";
import { getMiningConfig } from "@/lib/miningConfig";
import { ADS_DEPOSIT_RATE } from "@/lib/miningQuota";
import { claimToVesting, runClaimVestingBatch } from "@/lib/axisClaimVesting";
import type { VestingLockTier } from "@/generated/prisma/client";

export type MiningFormState = { error?: string; ok?: boolean } | undefined;

const MAX_BYTES = 10 * 1024 * 1024;
const PETROL_MERCHANTS = ["Petron", "Petronas", "Shell"] as const;

const REGION_ERROR = `Currently open to ${ALLOWED_MINING_COUNTRIES.join(", ")} residents only — more of Southeast Asia is opening up soon as AlphasAxis expands.`;

/** "2026-08" for the given date, used to enforce same-calendar-month-only receipt validity. */
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Spend-to-Earn: government RON95/diesel subsidy receipts. Approval now
 * deposits the subsidy value into the user's personal mining pool (see
 * miningPool.ts) rather than awarding $AXIS directly — it only becomes
 * spendable by completing tasks. Gated on KYC, nationality, the
 * same-calendar-month rule, and the tier-scaled weekly/monthly RM quota.
 */
export async function submitPetrolReceipt(
  _prevState: MiningFormState,
  formData: FormData
): Promise<MiningFormState> {
  const user = await requireUser();
  const prisma = getPrisma();

  const kyc = await prisma.kycSubmission.findUnique({ where: { userId: user.id } });
  if (kyc?.status !== "VERIFIED") {
    return { error: "Identity verification (KYC) must be approved before submitting subsidy receipts." };
  }
  if (!isCountryAllowedForMining(kyc.nationality)) {
    return { error: REGION_ERROR };
  }

  const file = formData.get("receipt");
  const merchantName = stripControlChars(String(formData.get("merchantName") ?? ""));
  const receiptNumber = stripControlChars(String(formData.get("receiptNumber") ?? "")).slice(0, 60);
  const spendAmountRm = Number(formData.get("spendAmountRm"));
  const spendDateRaw = String(formData.get("spendDate") ?? "");
  const spendDate = spendDateRaw ? new Date(spendDateRaw) : null;

  if (!(file instanceof File) || file.size === 0) return { error: "Please attach a receipt photo." };
  if (file.size > MAX_BYTES) return { error: "File is too large (max 10MB)." };
  if (!PETROL_MERCHANTS.includes(merchantName as (typeof PETROL_MERCHANTS)[number])) {
    return { error: "Select which station this receipt is from." };
  }
  if (!receiptNumber) return { error: "Enter the receipt/invoice number." };
  if (!Number.isFinite(spendAmountRm) || spendAmountRm <= 0) {
    return { error: "Enter how much you spent on petrol (RM)." };
  }
  if (!spendDate || Number.isNaN(spendDate.getTime())) {
    return { error: "Enter the date shown on the receipt." };
  }

  const now = new Date();
  if (monthKey(spendDate) !== monthKey(now)) {
    return { error: "This receipt isn't from this calendar month — only same-month spend is eligible." };
  }

  const config = await getMiningConfig();
  const subsidyAmountRm = Math.round(spendAmountRm * config.petrolSubsidyRate * 100) / 100;

  const quota = await checkDepositQuota(user.id, "PETROL_RECEIPT", subsidyAmountRm, now);
  if (!quota.ok) return { error: quota.error };

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const perceptualHash = await computePerceptualHash(buffer);
  const duplicate = await checkDuplicateReceipt({ perceptualHash, receiptNumber });

  const blobPath = await uploadPrivateFile(`mining/${user.id}`, file.name, buffer);

  await prisma.axisMiningSubmission.create({
    data: {
      userId: user.id,
      taskType: "PETROL_RECEIPT",
      status: duplicate.isDuplicate ? "FLAGGED_DUPLICATE" : "PENDING",
      blobPath,
      merchantName,
      receiptNumber,
      subsidyAmountRm,
      depositValueRm: subsidyAmountRm,
      spendDate,
      perceptualHash,
      duplicateOfId: duplicate.matchedSubmissionId,
      rejectionReason: duplicate.isDuplicate ? duplicate.reason : null,
    },
  });

  revalidatePath("/earn/mine");
  return duplicate.isDuplicate
    ? { error: `Flagged for review: ${duplicate.reason}` }
    : { ok: true };
}

/**
 * Spend-to-Earn: Meta Ads spend onboarding. Deposit value = 10% of verified
 * ad spend, same deposit-pool mechanics as petrol receipts. No Meta Ads API
 * integration — the screenshot is manually verified by an admin against
 * the reported spend, same "pending manual review" pattern.
 */
export async function submitMetaAdsOnboarding(
  _prevState: MiningFormState,
  formData: FormData
): Promise<MiningFormState> {
  const user = await requireUser();
  const prisma = getPrisma();

  const kyc = await prisma.kycSubmission.findUnique({ where: { userId: user.id } });
  if (kyc?.status !== "VERIFIED") {
    return { error: "Identity verification (KYC) must be approved before onboarding ad spend." };
  }
  if (!isCountryAllowedForMining(kyc.nationality)) {
    return { error: REGION_ERROR };
  }

  const file = formData.get("proof");
  const category = String(formData.get("category") ?? "");
  const spendRm = Number(formData.get("spendRm"));
  const spendDateRaw = String(formData.get("spendDate") ?? "");
  const spendDate = spendDateRaw ? new Date(spendDateRaw) : null;

  if (!(file instanceof File) || file.size === 0) return { error: "Please attach a screenshot of your ad spend." };
  if (file.size > MAX_BYTES) return { error: "File is too large (max 10MB)." };
  if (category !== "PROPERTY_LOAN_LEADGEN" && category !== "GENERAL") {
    return { error: "Select an ad category." };
  }
  if (!Number.isFinite(spendRm) || spendRm <= 0) return { error: "Enter your ad spend (RM)." };
  if (!spendDate || Number.isNaN(spendDate.getTime())) {
    return { error: "Enter the date of this ad spend." };
  }

  const now = new Date();
  if (monthKey(spendDate) !== monthKey(now)) {
    return { error: "This spend isn't from this calendar month — only same-month spend is eligible." };
  }

  const depositValueRm = Math.round(spendRm * ADS_DEPOSIT_RATE * 100) / 100;
  const quota = await checkDepositQuota(user.id, "META_ADS_ONBOARDING", depositValueRm, now);
  if (!quota.ok) return { error: quota.error };

  const arrayBuffer = await file.arrayBuffer();
  const blobPath = await uploadPrivateFile(`mining/${user.id}`, file.name, arrayBuffer);

  await prisma.axisMiningSubmission.create({
    data: {
      userId: user.id,
      taskType: "META_ADS_ONBOARDING",
      status: "PENDING",
      blobPath,
      metaAdsCategory: category,
      adSpendRm: spendRm,
      depositValueRm,
      spendDate,
    },
  });

  revalidatePath("/earn/mine");
  return { ok: true };
}

export type ClaimVestingFormState = { error?: string; ok?: boolean } | undefined;

/**
 * Locks a slice of the user's claimable (mined but unlocked) $AXIS into a
 * fixed-term vesting schedule — see src/lib/axisClaimVesting.ts for the
 * payout-% table and MPM boost. Also runs the vesting batch first so any
 * $AXIS due to release from prior schedules lands before the new lock.
 */
export async function claimToVestingAction(
  _prevState: ClaimVestingFormState,
  formData: FormData
): Promise<ClaimVestingFormState> {
  const user = await requireUser();

  const amount = Number(formData.get("amount"));
  const lockTier = String(formData.get("lockTier") ?? "");
  const validTiers: VestingLockTier[] = ["SIX_MONTH", "ONE_YEAR", "TWO_YEAR", "THREE_YEAR"];
  if (!validTiers.includes(lockTier as VestingLockTier)) return { error: "Choose a lock term." };

  await runClaimVestingBatch(user.id);

  const result = await claimToVesting(user.id, amount, lockTier as VestingLockTier);
  if (!result.ok) return { error: result.error };

  revalidatePath("/earn/mine");
  revalidatePath("/profile");
  return { ok: true };
}

/** Idempotent no-op-safe release of any $AXIS due from vesting schedules — call on page load. */
export async function refreshClaimVesting(): Promise<void> {
  const user = await requireUser();
  await runClaimVestingBatch(user.id);
}
