import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { RunPrestigeDistributionForm } from "@/components/RunPrestigeDistributionForm";
import { getVerifiedPrestigeNodes, EARLY_BACKERS_POOL_TOKENS } from "@/lib/axisPrestigeDistribution";

export default async function AdminAxisPrestigePage() {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const [nodes, distributions] = await Promise.all([
    getVerifiedPrestigeNodes(),
    prisma.axisPrestigeDistribution.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const totalEverDistributed = distributions.reduce((sum, d) => sum + Number(d.totalDistributedTokens), 0);

  return (
    <div>
      <AppHeader title="AxisPrestige Distribution" backHref="/admin/users" />
      <div className="px-4 pt-4">
        <div className="card">
          <p className="row-title mb-1">Early Backers pool</p>
          <p className="row-sub">
            {EARLY_BACKERS_POOL_TOKENS.toLocaleString()} $AXIS total allocation (18% of supply) ·{" "}
            {totalEverDistributed.toLocaleString()} distributed to date across {distributions.length} quarter(s)
          </p>
        </div>

        <RunPrestigeDistributionForm nodeCount={nodes.length} />

        <p className="eyebrow mt-2">Past distributions</p>
        {distributions.length === 0 && <p className="p-note">No distributions yet.</p>}
        {distributions.map((d) => (
          <div key={d.id} className="row">
            <div className="min-w-0 flex-1">
              <p className="row-title">{d.quarterLabel}</p>
              <p className="row-sub">
                {Number(d.totalDistributedTokens).toLocaleString()} $AXIS · {Number(d.perNodeAmount).toLocaleString()}{" "}
                per node
              </p>
            </div>
            <div className="row-right">{new Date(d.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
