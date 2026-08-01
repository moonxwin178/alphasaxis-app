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
 * AxisPrestige is proof of already-minted Node NFTs on app.turbox.bond/node-pad,
 * not something minted in this app. This records the claim as PENDING — an admin
 * still has to confirm on-chain ownership (and the actual node count, since
 * there's no live blockchain integration to read it automatically) before it
 * counts toward vesting. Multiple nodes per person are allowed — nodeCount is
 * self-declared here and admin-verified/adjusted before approval; it doesn't
 * change the 3x multiplier (that stays flat per person), it just determines
 * how many separate node-vesting allocations get created on approval.
 */
export async function submitNodeVerification(walletAddress: string, nodeCount: number): Promise<NftFormState> {
  const user = await requireUser();
  const address = walletAddress.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { error: "Enter a valid wallet address (0x…)." };
  }
  if (!Number.isInteger(nodeCount) || nodeCount < 1 || nodeCount > 5000) {
    return { error: "Enter how many nodes this wallet holds (1 or more)." };
  }

  const prisma = getPrisma();
  const existingPending = await prisma.nftHolding.findFirst({
    where: { userId: user.id, tier: "AXIS_PRESTIGE", verificationStatus: "PENDING" },
  });
  if (existingPending) return { error: "You already have a claim pending admin review." };

  await prisma.nftHolding.create({
    data: {
      userId: user.id,
      tier: "AXIS_PRESTIGE",
      multiplier: TIER_MULTIPLIER.AXIS_PRESTIGE,
      chain: "unverified",
      walletAddress: address,
      claimedNodeCount: nodeCount,
      verificationStatus: "PENDING",
    },
  });

  revalidatePath("/profile");
  return undefined;
}
