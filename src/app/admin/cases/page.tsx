import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { AdminCaseRow } from "@/components/AdminCaseRow";
import { AssignAgentControl } from "@/components/AssignAgentControl";

const FINANCING_LABEL: Record<string, string> = {
  MORTGAGE: "Home loan",
  HIRE_PURCHASE: "Hire purchase",
  PERSONAL: "Personal financing",
  BUSINESS: "Business financing",
};

export default async function AdminCasesPage() {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const [cases, agents] = await Promise.all([
    prisma.case.findMany({
      include: { applicant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.agentProfile.findMany({ include: { user: { select: { name: true } } } }),
  ]);

  const agentOptions = agents.map((a) => ({ id: a.id, name: a.user.name }));

  return (
    <div>
      <AppHeader title="Case Approval" />
      <div className="px-4 pt-4">
        {cases.length === 0 && <p className="p-note">No cases submitted yet.</p>}
        {cases.map((c) => (
          <div key={c.id}>
            <AdminCaseRow
              caseId={c.id}
              title={`${FINANCING_LABEL[c.financingType]} — RM ${Number(c.amount).toLocaleString()}`}
              sub={`Case #${c.id.slice(0, 8).toUpperCase()} · ${c.applicant.name}`}
              status={c.status}
            />
            {c.status === "SUBMITTED" && <AssignAgentControl caseId={c.id} agents={agentOptions} />}
          </div>
        ))}
      </div>
    </div>
  );
}
