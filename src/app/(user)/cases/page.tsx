import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";

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

  const cases = await prisma.case.findMany({
    where: { applicantId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const totalFinanced = cases
    .filter((c) => c.status === "APPROVED" || c.status === "DISBURSED")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div>
      <AppHeader title="Active Cases" />
      <div className="px-4 pt-4">
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Active cases</div>
            <div className="value">{cases.filter((c) => c.status !== "DISBURSED").length}</div>
          </div>
          <div className="stat">
            <div className="label">Total financed</div>
            <div className="value">RM {totalFinanced.toLocaleString()}</div>
          </div>
        </div>

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

        <Link href="/calculator" className="btn secondary mt-3">
          Free Loan Calculator
        </Link>
        <Link href="/consultation" className="btn ghost">
          Request New Consultation
        </Link>
      </div>
    </div>
  );
}
