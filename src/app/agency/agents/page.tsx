import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { InviteAgentForm } from "@/components/InviteAgentForm";

export default async function AgencyAgentsPage() {
  const owner = await requireRole("AGENCY");
  const prisma = getPrisma();

  const agency = await prisma.agency.findUnique({
    where: { ownerId: owner.id },
    include: {
      agencyAgent: {
        where: { status: "ACTIVE" },
        include: { user: { include: { agentProfile: true } } },
      },
    },
  });

  const roster = agency?.agencyAgent ?? [];

  const caseCounts = await Promise.all(
    roster.map((r) =>
      r.user.agentProfile
        ? prisma.case.count({ where: { agentId: r.user.agentProfile.id } })
        : Promise.resolve(0)
    )
  );

  return (
    <div>
      <AppHeader title="Agent Management" />
      <div className="px-4 pt-4">
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Managed agents</div>
            <div className="value">{roster.length}</div>
          </div>
          <div className="stat">
            <div className="label">Active this month</div>
            <div className="value">{roster.filter((_, i) => caseCounts[i] > 0).length}</div>
          </div>
        </div>

        {roster.length === 0 && <p className="p-note">No agents on your roster yet.</p>}
        {roster.map((r, i) => (
          <div key={r.id} className="row">
            <div className="row-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                <circle cx="9" cy="8" r="3.3" />
                <circle cx="17" cy="9" r="2.6" />
                <path d="M2.5 20c1.2-3.6 4-5.5 6.5-5.5s5.3 1.9 6.5 5.5M15 14.7c2 .2 4 1.7 4.8 4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="row-title">{r.user.name}</p>
              <p className="row-sub">{caseCounts[i]} cases handled</p>
            </div>
            <span className={`badge ${caseCounts[i] > 0 ? "green" : "amber"}`}>
              {caseCounts[i] > 0 ? "Active" : "New"}
            </span>
          </div>
        ))}

        <div className="mt-2">
          <InviteAgentForm />
        </div>
      </div>
    </div>
  );
}
