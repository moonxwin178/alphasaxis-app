import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { ReferralCodeBox } from "@/components/ReferralCodeBox";
import { ClaimMilestoneButton } from "@/components/ClaimMilestoneButton";
import { getReferralMilestoneStatus } from "@/lib/referralMilestones";

export default async function EarnNetworkPage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const [referred, self, commissions, milestones] = await Promise.all([
    prisma.user.findMany({
      where: { referredById: user.id },
      select: { id: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { referralCode: true } }),
    prisma.membershipCommission.findMany({
      where: { recipientId: user.id },
      include: { sourceUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getReferralMilestoneStatus(user.id),
  ]);

  const pendingUsdt = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + Number(c.usdtAmount), 0);

  return (
    <div>
      <AppHeader title="Network to Earn" backHref="/earn" />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <div className="stat-grid !mb-0">
          <div className="stat">
            <div className="label">Direct referrals</div>
            <div className="value">{referred.length}</div>
          </div>
          <div className="stat">
            <div className="label">Pending USDT</div>
            <div className="value">${pendingUsdt.toLocaleString()}</div>
          </div>
        </div>

        <div className="card !mb-0">
          <p className="row-title mb-1">Earn on every Agent/Agency mint</p>
          <p className="p-note !mb-0">
            10% of the mint price when someone you referred mints (Tier 1), and 5% when your
            referral&apos;s referral mints (Tier 2) — paid in USDT.
          </p>
        </div>

        <div>
          <p className="eyebrow">Milestone rewards ($AXIS)</p>
          <p className="p-note !mb-1">
            Paid as claimable $AXIS — lock it into a term at Agent2Mine to make it spendable.
          </p>
          {milestones.map((m) => (
            <div key={m.key} className="row">
              <div className="row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                  <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="row-title">{m.label}</p>
                <p className="row-sub">
                  {Math.min(m.progress, m.threshold)}/{m.threshold} · +{m.rewardAxis.toLocaleString()} $AXIS
                </p>
              </div>
              <ClaimMilestoneButton milestoneKey={m.key} eligible={m.eligible} claimed={m.claimed} />
            </div>
          ))}
        </div>

        <div>
          <p className="eyebrow">Your referrals</p>
          {referred.length === 0 && <p className="p-note">No referrals yet — share your code below.</p>}
          {referred.map((r) => (
            <div key={r.id} className="row">
              <div className="row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                  <circle cx="9" cy="8" r="3.3" />
                  <circle cx="17" cy="9" r="2.6" />
                  <path d="M2.5 20c1.2-3.6 4-5.5 6.5-5.5s5.3 1.9 6.5 5.5M15 14.7c2 .2 4 1.7 4.8 4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="row-title">{r.name}</p>
                <p className="row-sub">Joined {new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="row-right">
                <span className="badge green">Active</span>
              </div>
            </div>
          ))}
        </div>

        {commissions.length > 0 && (
          <div>
            <p className="eyebrow">Commission history</p>
            {commissions.map((c) => (
              <div key={c.id} className="row">
                <div className="row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                    <rect x="3" y="6" width="18" height="13" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="row-title">
                    {c.sourceUser.name} minted {c.mintedRole === "AGENT" ? "Agent" : "Agency"}
                  </p>
                  <p className="row-sub">{c.tier === "TIER_1" ? "Tier 1 · 10%" : "Tier 2 · 5%"}</p>
                </div>
                <div className="row-right">
                  <span className={c.status === "PAID" ? "badge green" : "badge amber"}>
                    ${Number(c.usdtAmount).toLocaleString()} {c.status === "PAID" ? "paid" : "pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <ReferralCodeBox code={self.referralCode} />
      </div>
    </div>
  );
}
