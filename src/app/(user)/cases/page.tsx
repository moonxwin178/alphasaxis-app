import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { UserEntitlementsCard } from "@/components/UserEntitlementsCard";
import { PrestigeEntitlementsCard } from "@/components/PrestigeEntitlementsCard";

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  SUBMITTED: { cls: "badge amber", label: "Submitted" },
  ASSIGNED: { cls: "badge amber", label: "Assigned" },
  DOCS: { cls: "badge amber", label: "Docs pending" },
  REVIEW: { cls: "badge amber", label: "In review" },
  APPROVED: { cls: "badge green", label: "Approved" },
  DISBURSED: { cls: "badge green", label: "Disbursed" },
  FLAGGED: { cls: "badge red", label: "Flagged" },
};

const FINANCING_LABEL: Record<string, string> = {
  MORTGAGE: "Home loan",
  HIRE_PURCHASE: "Hire purchase",
  PERSONAL: "Personal financing",
  BUSINESS: "Business financing",
};

export default async function CasesPage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const [cases, prestigeHolding] = await Promise.all([
    prisma.case.findMany({
      where: { applicantId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.nftHolding.findFirst({
      where: { userId: user.id, tier: "AXIS_PRESTIGE", verificationStatus: { in: ["PENDING", "VERIFIED"] } },
    }),
  ]);

  const totalFinanced = cases
    .filter((c) => c.status === "APPROVED" || c.status === "DISBURSED")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div>
      <AppHeader title="Active Cases" />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <UserEntitlementsCard userId={user.id} />
        <PrestigeEntitlementsCard userId={user.id} />

        <div className="stat-grid !mb-0">
          <div className="stat">
            <div className="label">Active cases</div>
            <div className="value">{cases.filter((c) => c.status !== "DISBURSED").length}</div>
          </div>
          <div className="stat">
            <div className="label">Total financed</div>
            <div className="value">RM {totalFinanced.toLocaleString()}</div>
          </div>
        </div>

        <div>
          <p className="eyebrow">Your cases</p>
          {cases.length === 0 && (
            <p className="p-note">No cases yet — request a consultation to get started.</p>
          )}
          {cases.map((c) => {
            const badge = STATUS_BADGE[c.status];
            return (
              <Link key={c.id} href={`/cases/${c.id}`} className="row">
                <div className="row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                    <path d="M3 7h18v12H3z" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="row-title">
                    {FINANCING_LABEL[c.financingType]} — RM {Number(c.amount).toLocaleString()}
                  </p>
                  <p className="row-sub">Case #{c.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="row-right">
                  <span className={badge.cls}>{badge.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5">
          <Link href="/calculator" className="btn secondary !mb-0">
            Free Loan Calculator
          </Link>
          <Link href="/consultation" className="btn ghost !mb-0">
            Request New Consultation
          </Link>
        </div>

        <div>
          <p className="eyebrow">While you're here</p>
          <div className="grid2">
            <Link href="/earn" className="card !mb-0 cursor-pointer text-center">
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
                </svg>
              </div>
              <p className="row-title mt-0.5">Earn $AXIS</p>
              <p className="row-sub">Daily check-ins & tasks</p>
            </Link>
            <Link href="/market" className="card !mb-0 cursor-pointer text-center">
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M4 8h16l-1.5 12h-13z" />
                  <path d="M8 8V6a4 4 0 0 1 8 0v2" />
                </svg>
              </div>
              <p className="row-title mt-0.5">Marketplace</p>
              <p className="row-sub">Redeem points for vouchers</p>
            </Link>
            <Link href="/earn/network" className="card !mb-0 cursor-pointer text-center">
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="9" cy="8" r="3.3" />
                  <circle cx="17" cy="9" r="2.6" />
                  <path d="M2.5 20c1.2-3.6 4-5.5 6.5-5.5s5.3 1.9 6.5 5.5M15 14.7c2 .2 4 1.7 4.8 4" />
                </svg>
              </div>
              <p className="row-title mt-0.5">Invite & Earn</p>
              <p className="row-sub">Refer a friend, earn per case</p>
            </Link>
            <Link href="/wallet" className="card !mb-0 cursor-pointer text-center">
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="6" width="18" height="13" rx="2" />
                  <path d="M3 10h18M16 14.5h2.5" />
                </svg>
              </div>
              <p className="row-title mt-0.5">Your Wallet</p>
              <p className="row-sub">Track your points balance</p>
            </Link>
          </div>
        </div>

        {!prestigeHolding && (
          <Link
            href="/nft-verification?return=/cases"
            className="card !mb-0 flex items-center gap-3 border-[var(--gold-light)] bg-[linear-gradient(135deg,rgba(255,218,164,0.1),rgba(158,124,69,0.04))]"
          >
            <div className="card-icon !m-0 bg-[linear-gradient(135deg,var(--gold-light),var(--gold))] text-[#241505]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="row-title">Own an AxisPrestige Node?</p>
              <p className="row-sub">Verify it for the 3x Agent2Mine multiplier</p>
            </div>
            <div className="chev">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
