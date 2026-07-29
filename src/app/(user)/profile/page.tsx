import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { ReferralCodeBox } from "@/components/ReferralCodeBox";
import { LogoutButton } from "@/components/LogoutButton";
import { RoleApplicationForm } from "@/components/RoleApplicationForm";
import { TIER_LABEL, TIER_MULTIPLIER } from "@/lib/commission";

const KYC_BADGE: Record<string, string> = {
  NOT_SUBMITTED: '<span class="badge amber">Not submitted</span>',
  PENDING: '<span class="badge amber">In review</span>',
  VERIFIED: '<span class="badge green">Verified</span>',
  MISMATCH: '<span class="badge red">Mismatch</span>',
};

export default async function ProfilePage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const [self, kyc, pendingApplication, nftHolding] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    prisma.kycSubmission.findUnique({ where: { userId: user.id } }),
    prisma.roleApplication.findFirst({ where: { userId: user.id, status: "PENDING" } }),
    prisma.nftHolding.findFirst({ where: { userId: user.id }, orderBy: { multiplier: "desc" } }),
  ]);

  const initials = self.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <AppHeader title="My Profile" />
      <div className="px-4 pt-4">
        <div className="card flex items-center gap-3">
          <div className="tier-ring">
            <div className="inner">{initials}</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">{self.name}</p>
            <p className="row-sub">{self.email}</p>
          </div>
        </div>

        <ReferralCodeBox code={self.referralCode} />

        <p className="eyebrow mt-3.5">Settings</p>
        <div className="row">
          <div className="row-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
              <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">KYC status</p>
          </div>
          <div
            className="row-right"
            dangerouslySetInnerHTML={{ __html: KYC_BADGE[kyc?.status ?? "NOT_SUBMITTED"] }}
          />
        </div>

        <p className="eyebrow mt-3.5">My NFT</p>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="tier-ring">
              <div className="inner">{nftHolding ? TIER_LABEL[nftHolding.tier] : "None"}</div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="row-title">{nftHolding ? TIER_LABEL[nftHolding.tier] : "No NFT minted yet"}</p>
              <p className="row-sub">
                {nftHolding ? `${TIER_MULTIPLIER[nftHolding.tier]}x Agent2Mine multiplier` : "Mint one to unlock earning multipliers"}
              </p>
            </div>
          </div>
          <Link href="/nft-verification?return=/profile" className="btn secondary mt-2.5">
            {nftHolding ? "Upgrade NFT" : "Mint NFT"}
          </Link>
        </div>

        <p className="eyebrow mt-3.5">Grow with AlphasAxis</p>
        {pendingApplication ? (
          <div className="card">
            <p className="row-title mb-1">Application submitted</p>
            <p className="row-sub">
              Your {pendingApplication.requestedRole.toLowerCase()} application is under review. We&apos;ll
              notify you once it&apos;s approved.
            </p>
          </div>
        ) : (
          <RoleApplicationForm />
        )}

        <LogoutButton />
      </div>
    </div>
  );
}
