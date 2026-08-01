import { getPrestigeEntitlements } from "@/lib/dashboardMetrics";

export async function PrestigeEntitlementsCard({ userId }: { userId: string }) {
  const e = await getPrestigeEntitlements(userId);
  if (!e) return null;

  const vestPct = e.allocationTokens > 0 ? Math.min(100, (e.vestedTokens / e.allocationTokens) * 100) : 0;
  const realizedPct = e.realizedCap > 0 ? Math.min(100, (e.realizedTotal / e.realizedCap) * 100) : 0;

  return (
    <div className="card !mb-0" style={{ borderColor: "rgba(255,218,164,.35)" }}>
      <div className="flex items-center justify-between">
        <p className="row-title !mb-0">AxisPrestige node</p>
        {e.burned ? (
          <span className="badge red">Burned — cap reached</span>
        ) : e.inCliff ? (
          <span className="badge amber">In cliff</span>
        ) : (
          <span className="badge green">Vesting</span>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="p-note !mb-0">$AXIS vested</span>
          <span className="p-note !mb-0">
            {e.vestedTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })} /{" "}
            {e.allocationTokens.toLocaleString()}
          </span>
        </div>
        <div className="progress-track mt-1">
          <div className="progress-fill" style={{ width: `${vestPct}%` }} />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="p-note !mb-0">Realized value (25x cap)</span>
          <span className="p-note !mb-0">
            ${e.realizedTotal.toLocaleString()} / ${e.realizedCap.toLocaleString()}
          </span>
        </div>
        <div className="progress-track mt-1">
          <div className="progress-fill" style={{ width: `${realizedPct}%` }} />
        </div>
      </div>

      <div className="stat-grid mt-3 !mb-0">
        <div className="stat">
          <div className="label">Performance multiplier</div>
          <div className="value">{e.performanceMultiplier.toFixed(1)}x</div>
        </div>
        <div className="stat">
          <div className="label">Revenue share earned</div>
          <div className="value">${e.revenueShareEarned.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
