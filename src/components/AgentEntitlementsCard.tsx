import { getAgentEntitlements } from "@/lib/dashboardMetrics";

export async function AgentEntitlementsCard({ userId }: { userId: string }) {
  const e = await getAgentEntitlements(userId);
  if (!e) return null;

  return (
    <div className="card !mb-0">
      <div className="flex items-center justify-between">
        <p className="row-title !mb-0">{e.tierLabel}</p>
        <span className="badge gold">{e.multiplier}x multiplier</span>
      </div>
      <div className="stat-grid mt-3 !mb-0">
        <div className="stat">
          <div className="label">Cases handled</div>
          <div className="value">{e.casesHandled}</div>
        </div>
        <div className="stat">
          <div className="label">Lifetime earned</div>
          <div className="value">RM {e.lifetimeEarned.toLocaleString()}</div>
        </div>
      </div>
      <div className="stat-grid mt-2 !mb-0">
        <div className="stat">
          <div className="label">Pending</div>
          <div className="value">RM {e.pending.toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="label">Paid</div>
          <div className="value">RM {e.paid.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
