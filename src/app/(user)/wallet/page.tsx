import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { getPointsBalance } from "@/lib/points";
import { AppHeader } from "@/components/AppHeader";

const REASON_LABEL: Record<string, string> = {
  SPEND_TO_EARN: "Spend to earn reward",
  SUBMIT_TO_EARN: "Submit to earn reward",
  NETWORK_TO_EARN: "Network to earn reward",
  SOCIAL_TO_EARN: "Daily check-in",
  CONSULTATION: "Consultation submitted",
  REFERRAL_BONUS: "Referral bonus",
  VOUCHER_REDEMPTION: "Voucher redeemed",
  ADMIN_ADJUST: "Adjustment",
};

export default async function WalletPage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const [balance, recent] = await Promise.all([
    getPointsBalance(user.id),
    prisma.pointsLedgerEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div>
      <AppHeader title="Wallet" />
      <div className="px-4 pt-4">
        <div className="stat-grid">
          <div className="stat">
            <div className="label">$AXIS points</div>
            <div className="value">{balance.toLocaleString()}</div>
          </div>
          <div className="stat">
            <div className="label">Fiat balance</div>
            <div className="value">RM 0</div>
          </div>
        </div>

        <div className="card" style={{ borderColor: "rgba(158,124,69,.4)" }}>
          <p className="row-title mb-1">On-chain wallet — coming soon</p>
          <p className="row-sub">
            Connect-your-own-wallet crypto support, staking, and fiat top-ups are on the roadmap and
            not yet part of the beta. Your $AXIS points are tracked here and redeemable in the
            Marketplace today.
          </p>
        </div>

        <p className="eyebrow">Recent activity</p>
        {recent.length === 0 && <p className="p-note">No transactions yet.</p>}
        {recent.map((entry) => (
          <div key={entry.id} className="row">
            <div className="row-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                <rect x="3" y="6" width="18" height="13" rx="2" />
                <path d="M3 10h18" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="row-title">{REASON_LABEL[entry.reason] ?? entry.reason}</p>
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
  );
}
