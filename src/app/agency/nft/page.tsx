import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { TIER_LABEL, TIER_MULTIPLIER } from "@/lib/commission";

export default async function AgencyNftPage() {
  const owner = await requireRole("AGENCY");
  const prisma = getPrisma();

  const [nftHolding, agency] = await Promise.all([
    prisma.nftHolding.findFirst({ where: { userId: owner.id }, orderBy: { multiplier: "desc" } }),
    prisma.agency.findUnique({ where: { ownerId: owner.id } }),
  ]);

  return (
    <div>
      <AppHeader title="NFT Privileges" />
      <div className="px-4 pt-4">
        <div className="card flex items-center gap-3.5 p-4">
          <div className="tier-ring lg">
            <div className="inner">{nftHolding ? TIER_LABEL[nftHolding.tier] : "None"}</div>
          </div>
          <div>
            <p className="row-title text-[15px]">{agency?.name ?? "Your agency"}</p>
            <p className="row-sub">
              {nftHolding ? `${TIER_LABEL[nftHolding.tier]} · ${TIER_MULTIPLIER[nftHolding.tier]}x multiplier` : "No NFT minted yet"}
            </p>
          </div>
        </div>

        <div className="row">
          <div className="row-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
              <rect x="3" y="8" width="18" height="4" />
              <rect x="5" y="12" width="14" height="9" />
              <path d="M12 8v13" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">Branch Revenue Entitlement</p>
            <p className="row-sub">Included in your NFT tier</p>
          </div>
        </div>
        <div className="row">
          <div className="row-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
              <path d="M3 7h18v12H3z" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">Commission Qualification</p>
            <p className="row-sub">Unlocks agent revenue share</p>
          </div>
        </div>
        <div className="row">
          <div className="row-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
              <path d="M8 4h8v6a4 4 0 0 1-8 0z" />
              <path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M10 18h4M12 14v4M8 21h8" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">Global Pool Eligibility</p>
            <p className="row-sub">Subject to quarterly review</p>
          </div>
        </div>

        <Link href="/nft-verification?return=/agency/nft" className="btn primary mt-3">
          {nftHolding ? "Upgrade Node" : "Mint Node"}
        </Link>
      </div>
    </div>
  );
}
