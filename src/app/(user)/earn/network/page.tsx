import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { ReferralCodeBox } from "@/components/ReferralCodeBox";

export default async function EarnNetworkPage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const [referred, self] = await Promise.all([
    prisma.user.findMany({
      where: { referredById: user.id },
      select: { id: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { referralCode: true } }),
  ]);

  return (
    <div>
      <AppHeader title="Network to Earn" backHref="/earn" />
      <div className="px-4 pt-4">
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Direct referrals</div>
            <div className="value">{referred.length}</div>
          </div>
          <div className="stat">
            <div className="label">Network size</div>
            <div className="value">{referred.length}</div>
          </div>
        </div>

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

        <ReferralCodeBox code={self.referralCode} />
      </div>
    </div>
  );
}
