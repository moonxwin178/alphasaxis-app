import Link from "next/link";
import { TierRing } from "@/components/TierRing";
import { getUserEntitlements } from "@/lib/dashboardMetrics";

export async function UserEntitlementsCard({ userId }: { userId: string }) {
  const e = await getUserEntitlements(userId);
  const capPct = e.monthlyCap > 0 ? Math.min(100, Math.round((e.usedThisMonth / e.monthlyCap) * 100)) : 0;

  return (
    <div className="card !mb-0">
      <div className="flex items-center gap-3">
        <TierRing tier={e.tier} />
        <div className="min-w-0 flex-1">
          <p className="row-title">{e.tierLabel}</p>
          <p className="row-sub">{e.multiplier}x Agent2Mine multiplier</p>
        </div>
        {e.isPrestige && (
          <Link href="/profile" className="badge gold shrink-0">
            Node status
          </Link>
        )}
      </div>

      <div className="stat-grid mt-3 !mb-0">
        <div className="stat">
          <div className="label">$AXIS points</div>
          <div className="value">{e.pointsBalance.toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="label">$AXIS mined</div>
          <div className="value">{e.axisBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {e.monthlyCap > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="p-note !mb-0">Agent2Mine cap this month</span>
            <span className="p-note !mb-0">{capPct}% used</span>
          </div>
          <div className="progress-track mt-1">
            <div className="progress-fill" style={{ width: `${capPct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
