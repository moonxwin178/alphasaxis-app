import Image from "next/image";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { getPointsBalance } from "@/lib/points";
import { getWalletBalance } from "@/lib/wallet";
import { AppHeader } from "@/components/AppHeader";
import { TopUpForm } from "@/components/TopUpForm";
import { WalletConnectMockup } from "@/components/WalletConnectMockup";

const POINTS_REASON_LABEL: Record<string, string> = {
  SPEND_TO_EARN: "Spend to earn reward",
  SUBMIT_TO_EARN: "Submit to earn reward",
  NETWORK_TO_EARN: "Network to earn reward",
  SOCIAL_TO_EARN: "Daily check-in",
  CONSULTATION: "Consultation submitted",
  REFERRAL_BONUS: "Referral bonus",
  VOUCHER_REDEMPTION: "Voucher redeemed",
  SERVICE_REQUEST: "Service requested",
  ADMIN_ADJUST: "Adjustment",
};

const WALLET_REASON_LABEL: Record<string, string> = {
  TOPUP: "Wallet top-up",
  AGENT_MEMBERSHIP: "Agent membership fee",
  AGENCY_MEMBERSHIP: "Agency membership fee",
  AGENCY_MEMBERSHIP_REFUND: "Agency membership refund",
  ADMIN_ADJUST: "Adjustment",
  AXISPRESTIGE_REVENUE_SHARE: "AxisPrestige revenue share",
};

export default async function WalletPage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const [pointsBalance, usdBalance, pointsRecent, walletRecent, pendingTopUp] = await Promise.all([
    getPointsBalance(user.id),
    getWalletBalance(user.id),
    prisma.pointsLedgerEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.walletLedgerEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.walletTopUpRequest.findFirst({ where: { userId: user.id, status: "PENDING" } }),
  ]);

  return (
    <div>
      <AppHeader title="Wallet" />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <div className="stat-grid !mb-0">
          <div className="stat">
            <div className="label flex items-center gap-1.5">
              <Image src="/nft/token.png" alt="$AXIS" width={14} height={14} className="rounded-full" />
              $AXIS points
            </div>
            <div className="value">{pointsBalance.toLocaleString()}</div>
          </div>
          <div className="stat">
            <div className="label">USD balance</div>
            <div className="value">${usdBalance.toLocaleString()}</div>
          </div>
        </div>

        <WalletConnectMockup />

        <div>
          <p className="eyebrow">Top up</p>
          {pendingTopUp ? (
            <div className="card !mb-0">
              <p className="row-title mb-1">Top-up pending review</p>
              <p className="row-sub">
                ${Number(pendingTopUp.amountUsd).toLocaleString()} via {pendingTopUp.method === "RM" ? "bank transfer" : "USDT deposit"} —
                an admin will confirm and credit this shortly.
              </p>
            </div>
          ) : (
            <TopUpForm />
          )}
        </div>

        <div>
          <p className="eyebrow">Wallet activity</p>
          {walletRecent.length === 0 && <p className="p-note">No wallet transactions yet.</p>}
          {walletRecent.map((entry) => (
            <div key={entry.id} className="row">
              <div className="row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                  <rect x="3" y="6" width="18" height="13" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="row-title">{WALLET_REASON_LABEL[entry.reason] ?? entry.reason}</p>
                <p className="row-sub">{new Date(entry.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="row-right">
                {Number(entry.delta) > 0 ? "+" : ""}
                ${Number(entry.delta).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div>
          <p className="eyebrow">$AXIS points activity</p>
          {pointsRecent.length === 0 && <p className="p-note">No points transactions yet.</p>}
          {pointsRecent.map((entry) => (
            <div key={entry.id} className="row">
              <div className="row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                  <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="row-title">{POINTS_REASON_LABEL[entry.reason] ?? entry.reason}</p>
                <p className="row-sub">{new Date(entry.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="row-right">
                {entry.delta > 0 ? "+" : ""}
                {entry.delta} pts
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
