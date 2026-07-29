"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { getPointsBalance } from "@/lib/points";

export type MarketFormState = { error?: string; ok?: boolean } | undefined;

export async function redeemVoucher(voucherId: string): Promise<MarketFormState> {
  const user = await requireUser();
  const prisma = getPrisma();

  const voucher = await prisma.voucher.findUnique({ where: { id: voucherId } });
  if (!voucher || !voucher.active) return { error: "This voucher is no longer available." };

  const balance = await getPointsBalance(user.id);
  if (balance < voucher.costPoints) return { error: "Not enough points to redeem this voucher." };

  await prisma.$transaction([
    prisma.order.create({ data: { userId: user.id, voucherId: voucher.id } }),
    prisma.pointsLedgerEntry.create({
      data: { userId: user.id, delta: -voucher.costPoints, reason: "VOUCHER_REDEMPTION", refId: voucher.id },
    }),
  ]);

  revalidatePath("/market");
  return { ok: true };
}
