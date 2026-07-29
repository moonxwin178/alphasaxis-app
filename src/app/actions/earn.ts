"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { uploadPrivateFile } from "@/lib/blob";

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
  revalidatePath("/earn/submit");
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

  revalidatePath("/earn/social");
  return { ok: true };
}
