"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { TIER_MULTIPLIER } from "@/lib/commission";
import type { NftTier } from "@/generated/prisma/client";

export type NftFormState = { error?: string } | undefined;

const VALID_TIERS: NftTier[] = ["AXIS_ZERO", "AXIS_ONE", "AXIS_PRO", "AXIS_PRESTIGE"];

export async function mintNftTier(tier: string): Promise<NftFormState> {
  const user = await requireUser();

  if (!VALID_TIERS.includes(tier as NftTier)) return { error: "Invalid tier." };

  const prisma = getPrisma();
  await prisma.nftHolding.create({
    data: { userId: user.id, tier: tier as NftTier, multiplier: TIER_MULTIPLIER[tier as NftTier] },
  });

  revalidatePath("/profile");
  revalidatePath("/agent/score");
  revalidatePath("/agency/nft");
  return undefined;
}
