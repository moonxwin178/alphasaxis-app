import "server-only";
import { getPrisma } from "./prisma";
import type { WalletReason } from "@/generated/prisma/client";

export async function getWalletBalance(userId: string): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.walletLedgerEntry.aggregate({
    where: { userId },
    _sum: { delta: true },
  });
  return Number(result._sum.delta ?? 0);
}

export async function addWalletEntry(userId: string, delta: number, reason: WalletReason, refId?: string) {
  const prisma = getPrisma();
  await prisma.walletLedgerEntry.create({ data: { userId, delta, reason, refId } });
}
