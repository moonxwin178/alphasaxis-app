import Link from "next/link";
import { getAdminPlatformMetrics } from "@/lib/dashboardMetrics";

const ROLE_LABEL: Record<string, string> = {
  USER: "Users",
  AGENT: "Agents",
  AGENCY: "Agencies",
  LOAN_CONSULTANT: "Consultants",
  ADMIN: "Admins",
};

export async function AdminPlatformMetricsCard() {
  const m = await getAdminPlatformMetrics();
  const pendingItems = [
    { label: "KYC reviews", count: m.pending.kyc, href: "/admin/users" },
    { label: "Unassigned cases", count: m.pending.cases, href: "/admin/cases" },
    { label: "Agent2Mine submissions", count: m.pending.mining, href: "/admin/mining" },
    { label: "Node claims", count: m.pending.nodeClaims, href: "/admin/axisprestige" },
    { label: "Open disputes", count: m.pending.disputes, href: "/admin/disputes" },
    { label: "Wallet top-ups", count: m.pending.topUps, href: "/admin/users" },
  ].filter((p) => p.count > 0);

  return (
    <div className="card !mb-0">
      <p className="row-title mb-2">Platform overview</p>
      <div className="stat-grid !mb-0">
        <div className="stat">
          <div className="label">Total commission volume</div>
          <div className="value">RM {m.totalCommissionVolume.toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="label">$AXIS mined (Agent2Mine)</div>
          <div className="value">{m.totalAxisMined.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>
      <div className="stat-grid mt-2 !mb-0">
        <div className="stat">
          <div className="label">$AXIS vested (AxisPrestige)</div>
          <div className="value">{m.totalAxisVested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="stat">
          <div className="label">Emission pool remaining</div>
          <div className="value">{(m.poolRemaining / 1_000_000_000).toFixed(2)}B</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.entries(m.roleCounts).map(([role, count]) => (
          <span key={role} className="badge amber">
            {ROLE_LABEL[role] ?? role}: {count}
          </span>
        ))}
      </div>

      {pendingItems.length > 0 && (
        <div className="mt-3">
          <p className="eyebrow !mt-0">Needs your attention</p>
          {pendingItems.map((p) => (
            <Link key={p.label} href={p.href} className="row">
              <div className="min-w-0 flex-1">
                <p className="row-title">{p.label}</p>
              </div>
              <span className="badge red">{p.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
