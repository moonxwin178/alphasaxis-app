"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { TIER_MULTIPLIER } from "@/lib/commission";

export type NftFormState = { error?: string } | undefined;

// AxisZero is automatic for every user (not minted). AxisOne/AxisPro are granted
// automatically on Agent/Agency approval (see actions/roleApplication.ts) — neither
// is self-mintable here. AxisPrestige requires node-wallet verification, below.
export async function mintNftTier(): Promise<NftFormState> {
  return { error: "This tier isn't self-mintable. See your profile for how to unlock it." };
}

/**
 * AxisPrestige is proof of an already-minted Node NFT on app.turbox.bond/node-pad,
 * not something minted in this app. This records the claim as PENDING — an admin
 * still has to confirm on-chain ownership before it counts toward any multiplier.
 */
export async function submitNodeVerification(walletAddress: string): Promise<NftFormState> {
  const user = await requireUser();
  const address = walletAddress.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { error: "Enter a valid wallet address (0x…)." };
  }

  const prisma = getPrisma();
  const existing = await prisma.nftHolding.findFirst({
    where: { userId: user.id, tier: "AXIS_PRESTIGE" },
  });
  if (existing) return { error: "You already have an AxisPrestige verification on file." };

  await prisma.nftHolding.create({
    data: {
      userId: user.id,
      tier: "AXIS_PRESTIGE",
      multiplier: TIER_MULTIPLIER.AXIS_PRESTIGE,
      chain: "unverified",
      walletAddress: address,
      verificationStatus: "PENDING",
    },
  });

  revalidatePath("/profile");
  return undefined;
}
