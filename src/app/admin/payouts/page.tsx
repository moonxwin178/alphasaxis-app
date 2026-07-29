import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { AdminPayoutsPanel } from "@/components/AdminPayoutsPanel";

export default async function AdminPayoutsPage() {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const pendingCommissions = await prisma.commission.findMany({
    where: { status: "PENDING" },
    include: { case: { select: { id: true } } },
    orderBy: { computedAt: "desc" },
  });

  const agentProfiles = await prisma.agentProfile.findMany({
    where: { id: { in: pendingCommissions.map((c) => c.agentId) } },
    include: { user: { select: { name: true } } },
  });
  const agentNameById = new Map(agentProfiles.map((a) => [a.id, a.user.name]));

  const totalPending = pendingCommissions.reduce((sum, c) => sum + Number(c.amount), 0);

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
          pending={pendingCommissions.map((c) => ({
            id: c.id,
            agentName: agentNameById.get(c.agentId) ?? "Unknown agent",
            caseRef: `Case #${c.case.id.slice(0, 8).toUpperCase()}`,
            amount: Number(c.amount),
          }))}
        />
      </div>
    </div>
  );
}
