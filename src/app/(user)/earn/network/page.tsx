import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { ReferralCodeBox } from "@/components/ReferralCodeBox";
import { MilestoneRow } from "@/components/MilestoneRow";
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

        <Link href="/leaderboard" target="_blank" className="row">
          <div className="row-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
              <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
              <path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">Public leaderboard</p>
            <p className="row-sub">See how you rank against other referrers</p>
          </div>
          <div className="chev">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
        </Link>

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
            <MilestoneRow
              key={m.key}
              milestoneKey={m.key}
              label={m.label}
              progress={m.progress}
              threshold={m.threshold}
              rewardAxis={m.rewardAxis}
              eligible={m.eligible}
              claimed={m.claimed}
              code={self.referralCode}
            />
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
