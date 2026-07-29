import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { commissionRatePercent } from "@/lib/commission";

const FINANCING_LABEL: Record<string, string> = {
  MORTGAGE: "Home loan",
  HIRE_PURCHASE: "Hire purchase",
  PERSONAL: "Personal financing",
  BUSINESS: "Business financing",
};

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  ASSIGNED: { cls: "badge gold", label: "New" },
  DOCS: { cls: "badge amber", label: "Docs" },
  REVIEW: { cls: "badge amber", label: "Review" },
  APPROVED: { cls: "badge green", label: "Approved" },
  DISBURSED: { cls: "badge green", label: "Disbursed" },
  FLAGGED: { cls: "badge red", label: "Flagged" },
};

export default async function AgentPipelinePage() {
  const user = await requireRole("AGENT");
  const prisma = getPrisma();

  const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: user.id } });
  if (!agentProfile) {
    return (
      <div>
        <AppHeader title="Case Pipeline" />
        <div className="px-4 pt-4">
          <p className="p-note">Agent profile not found.</p>
        </div>
      </div>
    );
  }

  const cases = await prisma.case.findMany({
    where: { agentId: agentProfile.id },
    include: { applicant: { select: { name: true } }, commissions: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AppHeader title="Case Pipeline" />
      <div className="px-4 pt-4">
        {cases.length === 0 && <p className="p-note">No cases assigned to you yet.</p>}
        {cases.map((c) => {
          const badge = STATUS_BADGE[c.status] ?? { cls: "badge amber", label: c.status };
          const commission = c.commissions[0];
          return (
            <Link key={c.id} href={`/agent/pipeline/${c.id}`} className="row">
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
                <p className="row-sub">
                  Case #{c.id.slice(0, 8).toUpperCase()} · {c.applicant.name}
                  {commission && ` · Est. commission RM ${Number(commission.amount).toLocaleString()} (${commissionRatePercent(c.financingType)})`}
                </p>
              </div>
              <div className="row-right">
                <span className={badge.cls}>{badge.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
