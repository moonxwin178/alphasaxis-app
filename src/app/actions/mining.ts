"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { uploadPrivateFile } from "@/lib/blob";
import { computePerceptualHash, checkDuplicateReceipt } from "@/lib/receiptFraud";
import { stripControlChars } from "@/lib/apiSecurity";

export type MiningFormState = { error?: string; ok?: boolean } | undefined;

const MAX_BYTES = 10 * 1024 * 1024;
const PETROL_MERCHANTS = ["Petron", "Petronas", "Shell"] as const;

/**
 * Spend-to-Earn: government RON95/diesel subsidy receipts. Restricted in
 * spirit to KYC'd Malaysians — enforced here by requiring KYC VERIFIED
 * status (NRIC/passport review), since there's no separate nationality
 * field in the schema. Flagged to the user as worth a dedicated
 * citizenship field if stricter gating is needed.
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

  const file = formData.get("receipt");
  const merchantName = stripControlChars(String(formData.get("merchantName") ?? ""));
  const receiptNumber = stripControlChars(String(formData.get("receiptNumber") ?? "")).slice(0, 60);
  const subsidyAmountRm = Number(formData.get("subsidyAmountRm"));

  if (!(file instanceof File) || file.size === 0) return { error: "Please attach a receipt photo." };
  if (file.size > MAX_BYTES) return { error: "File is too large (max 10MB)." };
  if (!PETROL_MERCHANTS.includes(merchantName as (typeof PETROL_MERCHANTS)[number])) {
    return { error: "Select which station this receipt is from." };
  }
  if (!receiptNumber) return { error: "Enter the receipt/invoice number." };
  if (!Number.isFinite(subsidyAmountRm) || subsidyAmountRm <= 0) {
    return { error: "Enter the government subsidy amount shown on the receipt." };
  }

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
 * Spend-to-Earn: Meta Ads spend onboarding. Tiered — property/loan-financing
 * lead-gen ads specifically earn a higher reward than general ad spend, per
 * the confirmed rule. No Meta Ads API integration (needs a Meta business
 * registration we don't have) — the screenshot is manually verified by an
 * admin against the reported spend, same "pending manual review" pattern.
 */
export async function submitMetaAdsOnboarding(
  _prevState: MiningFormState,
  formData: FormData
): Promise<MiningFormState> {
  const user = await requireUser();

  const file = formData.get("proof");
  const category = String(formData.get("category") ?? "");
  const spendUsd = Number(formData.get("spendUsd"));

  if (!(file instanceof File) || file.size === 0) return { error: "Please attach a screenshot of your ad spend." };
  if (file.size > MAX_BYTES) return { error: "File is too large (max 10MB)." };
  if (category !== "PROPERTY_LOAN_LEADGEN" && category !== "GENERAL") {
    return { error: "Select an ad category." };
  }
  if (!Number.isFinite(spendUsd) || spendUsd <= 0) return { error: "Enter your ad spend in USD." };

  const arrayBuffer = await file.arrayBuffer();
  const blobPath = await uploadPrivateFile(`mining/${user.id}`, file.name, arrayBuffer);

  const prisma = getPrisma();
  await prisma.axisMiningSubmission.create({
    data: {
      userId: user.id,
      taskType: "META_ADS_ONBOARDING",
      status: "PENDING",
      blobPath,
      metaAdsCategory: category,
      metaAdsSpendUsd: spendUsd,
    },
  });

  revalidatePath("/earn/mine");
  return { ok: true };
}
