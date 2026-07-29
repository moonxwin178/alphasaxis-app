import "server-only";
import { getPrisma } from "./prisma";
import type { PointsReason } from "@/generated/prisma/client";

export async function getPointsBalance(userId: string): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.pointsLedgerEntry.aggregate({
    where: { userId },
    _sum: { delta: true },
  });
  return result._sum.delta ?? 0;
}

export async function awardPoints(
  userId: string,
  delta: number,
  reason: PointsReason,
  refId?: string
): Promise<void> {
  const prisma = getPrisma();
  await prisma.pointsLedgerEntry.create({ data: { userId, delta, reason, refId } });
}
