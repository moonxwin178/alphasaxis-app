"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { uploadPrivateFile } from "@/lib/blob";
import { mineOutForTask } from "@/lib/miningPool";

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

/** Idempotent one-time checklist tied to real account state (not per-case tasks yet — see Phase B). */
const SUBMIT_TASKS = [
  { key: "kyc_submitted", label: "Submit your identity verification", points: 50 },
  { key: "first_case", label: "Submit your first case", points: 100 },
  { key: "phone_added", label: "Add a phone number to your profile", points: 20 },
] as const;

export async function getSubmitTaskStatus(userId: string) {
  const prisma = getPrisma();
  const [user, kyc, caseCount, claimed] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { phone: true } }),
    prisma.kycSubmission.findUnique({ where: { userId } }),
    prisma.case.count({ where: { applicantId: userId } }),
    prisma.pointsLedgerEntry.findMany({
      where: { userId, reason: "SUBMIT_TO_EARN" },
      select: { refId: true },
    }),
  ]);

  const claimedKeys = new Set(claimed.map((c) => c.refId));
  const done: Record<string, boolean> = {
    kyc_submitted: !!kyc?.submittedAt,
    first_case: caseCount > 0,
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
  const claimed = await prisma.pointsLedgerEntry.findMany({
    where: { userId, reason: "SOCIAL_TO_EARN", refId: { in: SOCIAL_TASKS.map((t) => t.key) } },
    select: { refId: true },
  });
  const claimedKeys = new Set(claimed.map((c) => c.refId));
  return SOCIAL_TASKS.map((t) => ({ ...t, claimed: claimedKeys.has(t.key) }));
}

export async function claimSocialTask(taskKey: string): Promise<EarnFormState> {
  const user = await requireUser();
  const task = SOCIAL_TASKS.find((t) => t.key === taskKey);
  if (!task) return { error: "Unknown task." };

  const prisma = getPrisma();
  const existing = await prisma.pointsLedgerEntry.findFirst({
    where: { userId: user.id, reason: "SOCIAL_TO_EARN", refId: taskKey },
  });
  if (existing) return { error: "Already claimed." };

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
