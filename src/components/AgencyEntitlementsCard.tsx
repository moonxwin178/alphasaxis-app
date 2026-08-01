import { getAgencyEntitlements } from "@/lib/dashboardMetrics";

export async function AgencyEntitlementsCard({ ownerId }: { ownerId: string }) {
  const e = await getAgencyEntitlements(ownerId);
  if (!e) return null;

  return (
    <div className="card !mb-0">
      <div className="flex items-center justify-between">
        <p className="row-title !mb-0">{e.tierLabel}</p>
        <span className="badge gold">{e.multiplier}x multiplier</span>
      </div>
      <div className="stat-grid mt-3 !mb-0">
        <div className="stat">
          <div className="label">Roster size</div>
          <div className="value">{e.rosterSize}</div>
        </div>
        <div className="stat">
          <div className="label">Roster commission volume</div>
          <div className="value">RM {e.rosterVolume.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
