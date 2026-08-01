import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { ReferralCodeBox } from "@/components/ReferralCodeBox";
import { LogoutButton } from "@/components/LogoutButton";
import { RoleApplicationForm } from "@/components/RoleApplicationForm";
import { TierRing } from "@/components/TierRing";
import { TIER_LABEL, TIER_MULTIPLIER } from "@/lib/commission";
import { getWalletBalance } from "@/lib/wallet";
import { PhoneEditRow } from "@/components/PhoneEditRow";
import { getAxisVestingBalance } from "@/lib/axisEmission";

const KYC_BADGE: Record<string, string> = {
  NOT_SUBMITTED: '<span class="badge amber">Not submitted</span>',
  PENDING: '<span class="badge amber">In review</span>',
  VERIFIED: '<span class="badge green">Verified</span>',
  MISMATCH: '<span class="badge red">Mismatch</span>',
};

export default async function ProfilePage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const [self, kyc, pendingApplication, nftHolding, pendingNodeClaim, walletBalance] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    prisma.kycSubmission.findUnique({ where: { userId: user.id } }),
    prisma.roleApplication.findFirst({ where: { userId: user.id, status: "PENDING" } }),
    prisma.nftHolding.findFirst({
      where: { userId: user.id, verificationStatus: "VERIFIED" },
      orderBy: { multiplier: "desc" },
    }),
    prisma.nftHolding.findFirst({
      where: { userId: user.id, tier: "AXIS_PRESTIGE", verificationStatus: "PENDING" },
    }),
    getWalletBalance(user.id),
  ]);
  const currentTier = nftHolding?.tier ?? "AXIS_ZERO";
  const hasPrestige = nftHolding?.tier === "AXIS_PRESTIGE";
  const prestigeEarnings = hasPrestige
    ? await getAxisVestingBalance(user.id, "AXISPRESTIGE_QUARTERLY")
    : 0;

  const initials = self.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <AppHeader title="My Profile" />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <div className="card !mb-0 flex items-center gap-3">
          <div className="tier-ring">
            <div className="inner">{initials}</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">{self.name}</p>
            <p className="row-sub">{self.email}</p>
          </div>
        </div>

        <ReferralCodeBox code={self.referralCode} />

        <div>
          <p className="eyebrow">Settings</p>
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
          <PhoneEditRow phone={self.phone} />
        </div>

        <div>
          <p className="eyebrow">My NFT</p>
          <div className="card !mb-0">
            <div className="flex items-center gap-3">
              <TierRing tier={currentTier} />
              <div className="min-w-0 flex-1">
                <p className="row-title">{TIER_LABEL[currentTier]}</p>
                <p className="row-sub">{TIER_MULTIPLIER[currentTier]}x Agent2Mine multiplier</p>
              </div>
            </div>
            {currentTier === "AXIS_ZERO" && (
              <p className="p-note mt-2.5 !mb-0">
                Every account starts here automatically — no minting needed. AxisOne unlocks the
                moment you activate Agent below, AxisPro once your Agency mint is approved.
              </p>
            )}
            {pendingNodeClaim && (
              <p className="p-note mt-2.5 !mb-0">
                AxisPrestige verification for wallet{" "}
                {pendingNodeClaim.walletAddress?.slice(0, 6)}…{pendingNodeClaim.walletAddress?.slice(-4)}{" "}
                is pending admin review.
              </p>
            )}
            {!hasPrestige && !pendingNodeClaim && (
              <Link href="/nft-verification?return=/profile" className="btn secondary mt-2.5 !mb-0">
                Verify an AxisPrestige Node
              </Link>
            )}
            {hasPrestige && (
              <p className="p-note mt-2.5 !mb-0 text-[var(--green)]">
                {prestigeEarnings.toLocaleString()} $AXIS earned from quarterly node distributions.
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="eyebrow">Grow with AlphasAxis</p>
          {pendingApplication ? (
            <div className="card !mb-0">
              <p className="row-title mb-1">Application submitted</p>
              <p className="row-sub">
                Your {pendingApplication.requestedRole.toLowerCase()} mint fee has been deducted and is
                under admin review — refunded automatically if declined.
              </p>
            </div>
          ) : (
            <RoleApplicationForm walletBalance={walletBalance} />
          )}
        </div>

        <div>
          <p className="eyebrow">About</p>
          <a href="https://alphasaxis.com/terms" target="_blank" rel="noopener noreferrer" className="row">
            <div className="min-w-0 flex-1">
              <p className="row-title">Terms of Service</p>
            </div>
            <div className="chev">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </a>
          <a href="https://alphasaxis.com/privacy" target="_blank" rel="noopener noreferrer" className="row">
            <div className="min-w-0 flex-1">
              <p className="row-title">Privacy Policy</p>
            </div>
            <div className="chev">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </a>
          <a href="https://alphasaxis.com/risk-disclosure" target="_blank" rel="noopener noreferrer" className="row">
            <div className="min-w-0 flex-1">
              <p className="row-title">Risk Disclosure</p>
            </div>
            <div className="chev">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </a>
          <div className="row" style={{ cursor: "default" }}>
            <div className="min-w-0 flex-1">
              <p className="row-title">App version</p>
            </div>
            <div className="row-right">1.0.0</div>
          </div>
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}
