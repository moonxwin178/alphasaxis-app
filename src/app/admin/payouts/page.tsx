import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { AdminPayoutsPanel } from "@/components/AdminPayoutsPanel";

const ROLE_LABEL: Record<string, string> = {
  LEAD_PROVIDER: "Lead provider",
  CALLER: "Caller",
  CLOSER: "Closer",
  OVERRIDE_INTRODUCER: "Introducer override",
  OVERRIDE_UPLINE: "Upline override",
  OVERRIDE_CONSULTANT: "Consultant override",
};

export default async function AdminPayoutsPage() {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  // Only recipient-bound lines are payable to a person — AES/Treasury/
  // platform lines have no recipient and are house accounting, not payouts.
  const pendingLines = await prisma.commissionLineItem.findMany({
    where: { status: "PENDING", recipientId: { not: null } },
    include: { case: { select: { id: true } }, recipient: { select: { name: true } } },
    orderBy: { computedAt: "desc" },
  });

  const totalPending = pendingLines.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div>
      <AppHeader title="Commission Approval" />
      <div className="px-4 pt-4">
        <div className="card">
          <div className="label" style={{ fontSize: "10.5px", color: "var(--dim)", marginBottom: 4 }}>
            Pending payouts
          </div>
          <div style={{ fontSize: "19px", color: "var(--white)", fontWeight: 800 }}>
            RM {totalPending.toLocaleString()}
          </div>
        </div>
        <AdminPayoutsPanel
          pending={pendingLines.map((l) => ({
            id: l.id,
            agentName: `${l.recipient?.name ?? "Unknown"} — ${ROLE_LABEL[l.role] ?? l.role}`,
            caseRef: `Case #${l.case.id.slice(0, 8).toUpperCase()}`,
            amount: Number(l.amount),
          }))}
        />
      </div>
    </div>
  );
}
