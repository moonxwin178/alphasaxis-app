"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { addWalletEntry } from "@/lib/wallet";

export type WalletFormState = { error?: string; ok?: boolean } | undefined;

const VALID_METHODS = ["RM", "USDT"] as const;

export async function requestTopUp(formData: FormData): Promise<WalletFormState> {
  const user = await requireUser();
  const amountUsd = Number(formData.get("amountUsd"));
  const method = String(formData.get("method") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;

  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return { error: "Enter a valid amount." };
  if (!VALID_METHODS.includes(method as (typeof VALID_METHODS)[number])) return { error: "Invalid payment method." };

  const prisma = getPrisma();
  await prisma.walletTopUpRequest.create({
    data: { userId: user.id, amountUsd, method: method as "RM" | "USDT", note },
  });

  revalidatePath("/wallet");
  return { ok: true };
}

/**
 * Nothing here charges anyone — this only credits the in-app ledger once an
 * admin confirms the real payment (bank transfer / USDT deposit) actually
 * arrived. There's no payment gateway wired up yet; this is the manual
 * bridge until there is one.
 */
export async function reviewTopUp(requestId: string, approve: boolean): Promise<WalletFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  const request = await prisma.walletTopUpRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== "PENDING") return { error: "Request not found or already reviewed." };

  await prisma.walletTopUpRequest.update({
    where: { id: requestId },
    data: { status: approve ? "APPROVED" : "REJECTED", reviewedById: admin.id, reviewedAt: new Date() },
  });

  if (approve) {
    await addWalletEntry(request.userId, Number(request.amountUsd), "TOPUP", request.id);
  }

  revalidatePath("/admin/users");
  return undefined;
}
