import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { CaseTracker } from "@/components/CaseTracker";

const FINANCING_LABEL: Record<string, string> = {
  MORTGAGE: "Home loan",
  HIRE_PURCHASE: "Hire purchase",
  PERSONAL: "Personal financing",
  BUSINESS: "Business financing",
};

export default async function ConsultantPipelinePage() {
  const user = await requireRole("LOAN_CONSULTANT");
  const prisma = getPrisma();

  const cases = await prisma.case.findMany({
    where: { consultantId: user.id },
    include: {
      applicant: { select: { name: true, phone: true } },
      agent: { include: { user: { select: { name: true } } } },
      commissionLines: { where: { recipientId: user.id } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AppHeader title="Assigned Cases" />
      <div className="px-4 pt-4">
        {cases.length === 0 && <p className="p-note">No cases assigned to you yet.</p>}
        {cases.map((c) => {
          const yourCommission = c.commissionLines.reduce((sum, l) => sum + Number(l.amount), 0);
          return (
            <div key={c.id} className="card !mb-0 mb-3">
              <p className="eyebrow">Case #{c.id.slice(0, 8).toUpperCase()}</p>
              <p className="row-title mb-1 text-[15px]">
                {FINANCING_LABEL[c.financingType]} — RM {Number(c.amount).toLocaleString()}
              </p>
              <p className="row-sub mb-2">
                {c.applicant.name} · {c.applicant.phone ?? "No phone on file"}
              </p>
              <p className="row-sub mb-2">Introducing agent: {c.agent?.user.name ?? "—"}</p>
              <CaseTracker status={c.status} />
              {yourCommission > 0 && (
                <p className="p-note mt-2.5 !mb-0 text-[var(--green)]">
                  Your commission: RM {yourCommission.toLocaleString()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
