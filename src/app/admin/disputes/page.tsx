import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { AdminDisputeRow } from "@/components/AdminDisputeRow";

export default async function AdminDisputesPage() {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const disputes = await prisma.dispute.findMany({
    include: { raisedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div>
      <AppHeader title="Dispute Resolution" />
      <div className="px-4 pt-4">
        {disputes.length === 0 && <p className="p-note">No disputes raised yet.</p>}
        {disputes.map((d) => (
          <AdminDisputeRow
            key={d.id}
            disputeId={d.id}
            raisedBy={d.raisedBy.name}
            note={d.note}
            status={d.status}
          />
        ))}
      </div>
    </div>
  );
}
