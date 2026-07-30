import Image from "next/image";
import type { NftTier } from "@/generated/prisma/client";
import { TIER_IMAGE, TIER_LABEL } from "@/lib/commission";

export function TierRing({ tier, lg }: { tier: NftTier | null; lg?: boolean }) {
  const size = lg ? 64 : 48;
  return (
    <div className={`tier-ring${lg ? " lg" : ""}`}>
      {tier ? (
        <Image src={TIER_IMAGE[tier]} alt={TIER_LABEL[tier]} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <div className="inner">None</div>
      )}
    </div>
  );
}
