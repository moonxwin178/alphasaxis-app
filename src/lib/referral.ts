import "server-only";
import { customAlphabet } from "nanoid";
import { getPrisma } from "./prisma";

const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1
const generate = customAlphabet(REFERRAL_CODE_ALPHABET, 8);

export async function generateUniqueReferralCode(): Promise<string> {
  const prisma = getPrisma();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generate();
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique referral code.");
}
