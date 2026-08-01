import "server-only";
import { getPrisma } from "./prisma";
import bcrypt from "bcryptjs";

export const GRAND_MASTER_EMAIL = "grandmaster001@alphasaxis.internal";
export const GRAND_MASTER_REFERRAL_CODE = "GM00000001";

/**
 * Every user who registers without a real referral code is bound under this
 * account. It's what Party 2 (upline override) resolves to when there's no
 * real upline — and per the confirmed rule, an override that would land on
 * 001 redirects back to the introducer instead, since 001 never personally
 * receives a payout. This account exists so `referredById` is never null,
 * not so 001 collects money.
 *
 * Lazily created on first use, cached on globalThis like the Prisma client
 * singleton, so this never races the same idempotent creation twice.
 */
export async function getGrandMasterId(): Promise<string> {
  if (global.__grandMasterId) return global.__grandMasterId;

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email: GRAND_MASTER_EMAIL } });
  if (existing) {
    global.__grandMasterId = existing.id;
    return existing.id;
  }

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);
  const created = await prisma.user.create({
    data: {
      name: "Grand Master Affiliate 001",
      email: GRAND_MASTER_EMAIL,
      passwordHash,
      referralCode: GRAND_MASTER_REFERRAL_CODE,
      role: "USER", // placeholder account only — never logs in, never needs elevated access
    },
  });
  global.__grandMasterId = created.id;
  return created.id;
}

declare global {
  // eslint-disable-next-line no-var
  var __grandMasterId: string | undefined;
}
