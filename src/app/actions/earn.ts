"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { uploadPrivateFile } from "@/lib/blob";
import { mineOutForTask } from "@/lib/miningPool";
import { claimReferralMilestone } from "@/lib/referralMilestones";

export type EarnFormState = { error?: string; ok?: boolean } | undefined;

const MAX_BYTES = 10 * 1024 * 1024;

export async function submitSpendProof(
  _prevState: EarnFormState,
  formData: FormData
): Promise<EarnFormState> {
  const user = await requireUser();
  const file = formData.get("receipt");

  if (!(file instanceof File) || file.size === 0) return { error: "Please attach a receipt photo." };
  if (file.size > MAX_BYTES) return { error: "File is too large (max 10MB)." };

  const arrayBuffer = await file.arrayBuffer();
  const blobPath = await uploadPrivateFile(`receipts/${user.id}`, file.name, arrayBuffer);

  const prisma = getPrisma();
  await prisma.receiptUpload.create({ data: { userId: user.id, blobPath } });

  revalidatePath("/earn/spend");
  return { ok: true };
}

/**
 * Idempotent one-time checklist tied to real account state — nothing here
 * is self-declared, every task's eligibility comes from an actual DB row
 * (a submitted KYC, an uploaded document of the right type, a case that
 * reached a given status, a submitted insurance lead), so "Claim" only
 * ever pays out work that already happened. `href` is where the row links
 * to actually go do the task — matches the same "redirect to the real
 * action, don't let Claim fire blind" rule applied to SOCIAL_TASKS below.
 */
const SUBMIT_TASKS = [
  { key: "kyc_submitted", label: "Submit your identity verification", points: 50, href: "/kyc" },
  { key: "first_case", label: "Submit your first case", points: 100, href: "/cases" },
  { key: "case_ctos", label: "Submit your first client's CTOS report", points: 40, href: "/cases" },
  { key: "case_ccris", label: "Submit your first client's CCRIS report", points: 40, href: "/cases" },
  { key: "case_income_docs", label: "Submit income / payslip documents", points: 30, href: "/cases" },
  { key: "case_bank_statement", label: "Submit bank statement documents", points: 30, href: "/cases" },
  { key: "case_reaches_review", label: "Get a case into underwriting review", points: 50, href: "/cases" },
  { key: "case_approved", label: "Get a case approved", points: 150, href: "/cases" },
  { key: "insurance_lead", label: "Submit a potential insurance deal", points: 40, href: "/earn/submit#insurance" },
  { key: "phone_added", label: "Add a phone number to your profile", points: 20, href: "/profile" },
] as const;

export async function getSubmitTaskStatus(userId: string) {
  const prisma = getPrisma();
  const [user, kyc, cases, documents, insuranceLeadCount, claimed] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { phone: true } }),
    prisma.kycSubmission.findUnique({ where: { userId } }),
    prisma.case.findMany({ where: { applicantId: userId }, select: { id: true, status: true } }),
    prisma.document.findMany({
      where: { case: { applicantId: userId } },
      select: { docType: true },
    }),
    prisma.insuranceLead.count({ where: { submittedById: userId } }),
    prisma.pointsLedgerEntry.findMany({
      where: { userId, reason: "SUBMIT_TO_EARN" },
      select: { refId: true },
    }),
  ]);

  const hasDocType = (...keywords: string[]) =>
    documents.some((d) => keywords.some((kw) => d.docType.toLowerCase().includes(kw)));
  const inReviewOrLater = cases.some((c) => ["REVIEW", "APPROVED", "DISBURSED"].includes(c.status));
  const approved = cases.some((c) => ["APPROVED", "DISBURSED"].includes(c.status));

  const claimedKeys = new Set(claimed.map((c) => c.refId));
  const done: Record<string, boolean> = {
    kyc_submitted: !!kyc?.submittedAt,
    first_case: cases.length > 0,
    case_ctos: hasDocType("ctos"),
    case_ccris: hasDocType("ccris"),
    case_income_docs: hasDocType("payslip", "income"),
    case_bank_statement: hasDocType("bank"),
    case_reaches_review: inReviewOrLater,
    case_approved: approved,
    insurance_lead: insuranceLeadCount > 0,
    phone_added: !!user?.phone,
  };

  return SUBMIT_TASKS.map((t) => ({
    ...t,
    eligible: done[t.key],
    claimed: claimedKeys.has(t.key),
  }));
}

export async function claimSubmitTask(taskKey: string): Promise<EarnFormState> {
  const user = await requireUser();
  const task = SUBMIT_TASKS.find((t) => t.key === taskKey);
  if (!task) return { error: "Unknown task." };

  const statuses = await getSubmitTaskStatus(user.id);
  const status = statuses.find((s) => s.key === taskKey);
  if (!status?.eligible) return { error: "Not eligible yet." };
  if (status.claimed) return { error: "Already claimed." };

  await awardPoints(user.id, task.points, "SUBMIT_TO_EARN", task.key);
  await mineOutForTask(user.id);
  revalidatePath("/earn/submit");
  return { ok: true };
}

export async function submitInsuranceLead(
  _prevState: EarnFormState,
  formData: FormData
): Promise<EarnFormState> {
  const user = await requireUser();
  const contactName = String(formData.get("contactName") ?? "").trim().slice(0, 120);
  const contactPhone = String(formData.get("contactPhone") ?? "").trim().slice(0, 30);
  const insuranceType = String(formData.get("insuranceType") ?? "").trim().slice(0, 60);
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (contactName.length < 2) return { error: "Enter the contact's name." };
  if (contactPhone.length < 6) return { error: "Enter a valid contact phone number." };
  if (!insuranceType) return { error: "Select an insurance type." };

  const prisma = getPrisma();
  await prisma.insuranceLead.create({
    data: { submittedById: user.id, contactName, contactPhone, insuranceType, note: note || null },
  });

  revalidatePath("/earn/submit");
  return { ok: true };
}

export async function getInsuranceLeads(userId: string) {
  const prisma = getPrisma();
  return prisma.insuranceLead.findMany({ where: { submittedById: userId }, orderBy: { createdAt: "desc" } });
}

/**
 * Standard "typical Task to Earn platform" social follows — self-declared
 * (no API verification exists for these platforms), one-time, idempotent
 * via the same PointsLedgerEntry refId-check pattern as SUBMIT_TASKS. Real
 * handles/URLs need confirming before launch — these are placeholders
 * constructed from what was given, not verified live accounts.
 */
const SOCIAL_TASKS = [
  { key: "follow_instagram", label: "Follow @AlphasAxis on Instagram", points: 10, href: "https://instagram.com/alphasaxis" },
  { key: "follow_x", label: "Follow @AlphasAxis on X", points: 10, href: "https://x.com/alphasaxis" },
  { key: "join_telegram", label: "Join the AlphasAxis Telegram community", points: 10, href: "https://t.me/alphasaxis" },
  { key: "follow_estate_ig", label: "Follow @AlphasEstateSolutions on Instagram", points: 10, href: "https://instagram.com/alphasestatesolutions" },
  { key: "follow_tiktok", label: "Follow @AlphasAxis on TikTok", points: 10, href: "https://tiktok.com/@alphasaxis" },
] as const;

export async function getSocialTaskStatus(userId: string) {
  const prisma = getPrisma();
  const [claimed, started] = await Promise.all([
    prisma.pointsLedgerEntry.findMany({
      where: { userId, reason: "SOCIAL_TO_EARN", refId: { in: SOCIAL_TASKS.map((t) => t.key) } },
      select: { refId: true },
    }),
    prisma.socialTaskClick.findMany({ where: { userId }, select: { taskKey: true } }),
  ]);
  const claimedKeys = new Set(claimed.map((c) => c.refId));
  const startedKeys = new Set(started.map((s) => s.taskKey));
  return SOCIAL_TASKS.map((t) => ({ ...t, claimed: claimedKeys.has(t.key), started: startedKeys.has(t.key) }));
}

/** Fired when the user clicks a social task's link — records that they actually went, before Claim is allowed. */
export async function startSocialTask(taskKey: string): Promise<void> {
  const user = await requireUser();
  if (!SOCIAL_TASKS.some((t) => t.key === taskKey)) return;

  const prisma = getPrisma();
  await prisma.socialTaskClick.upsert({
    where: { userId_taskKey: { userId: user.id, taskKey } },
    update: {},
    create: { userId: user.id, taskKey },
  });
  revalidatePath("/earn/social");
}

export async function claimSocialTask(taskKey: string): Promise<EarnFormState> {
  const user = await requireUser();
  const task = SOCIAL_TASKS.find((t) => t.key === taskKey);
  if (!task) return { error: "Unknown task." };

  const prisma = getPrisma();
  const [existing, clicked] = await Promise.all([
    prisma.pointsLedgerEntry.findFirst({ where: { userId: user.id, reason: "SOCIAL_TO_EARN", refId: taskKey } }),
    prisma.socialTaskClick.findUnique({ where: { userId_taskKey: { userId: user.id, taskKey } } }),
  ]);
  if (existing) return { error: "Already claimed." };
  if (!clicked) return { error: "Visit the link first, then come back to claim." };

  await awardPoints(user.id, task.points, "SOCIAL_TO_EARN", taskKey);
  await mineOutForTask(user.id);
  revalidatePath("/earn/social");
  return { ok: true };
}

export async function claimDailyCheckIn(): Promise<EarnFormState> {
  const user = await requireUser();
  const prisma = getPrisma();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.checkIn.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });
  if (existing) return { error: "Already checked in today." };

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayCheckIn = await prisma.checkIn.findUnique({
    where: { userId_date: { userId: user.id, date: yesterday } },
  });

  const streakCount = (yesterdayCheckIn?.streakCount ?? 0) + 1;

  await prisma.checkIn.create({ data: { userId: user.id, date: today, streakCount } });
  await awardPoints(user.id, 5, "SOCIAL_TO_EARN", `checkin-${today.toISOString().slice(0, 10)}`);
  await mineOutForTask(user.id);

  revalidatePath("/earn/social");
  return { ok: true };
}

export async function claimReferralMilestoneAction(milestoneKey: string): Promise<EarnFormState> {
  const user = await requireUser();
  const result = await claimReferralMilestone(user.id, milestoneKey);
  if (!result.ok) return { error: result.error };

  revalidatePath("/earn/network");
  return { ok: true };
}
