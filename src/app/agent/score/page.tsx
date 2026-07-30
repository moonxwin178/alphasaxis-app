import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { TierRing } from "@/components/TierRing";
import { TIER_LABEL, TIER_MULTIPLIER } from "@/lib/commission";

export default async function AgentScorePage() {
  const user = await requireRole("AGENT");
  const prisma = getPrisma();

  const agentProfile = await prisma.agentProfile.findUnique({
    where: { userId: user.id },
    include: { user: { include: { nftHoldings: true } } },
  });

  if (!agentProfile) {
    return (
      <div>
        <AppHeader title="Performance Score" />
        <div className="px-4 pt-4">
          <p className="p-note">Agent profile not found.</p>
        </div>
      </div>
    );
  }

  const [totalCases, closedCases, allAgentsWithVolume] = await Promise.all([
    prisma.case.count({ where: { agentId: agentProfile.id } }),
    prisma.case.count({ where: { agentId: agentProfile.id, status: { in: ["APPROVED", "DISBURSED"] } } }),
    prisma.case.groupBy({
      by: ["agentId"],
      where: { agentId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { agentId: "desc" } },
    }),
  ]);

  const conversionRate = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;
  const rank = allAgentsWithVolume.findIndex((a) => a.agentId === agentProfile.id) + 1;
  const totalAgents = allAgentsWithVolume.length;

  const tier = agentProfile.user.nftHoldings[0]?.tier ?? null;
  const multiplier = tier ? TIER_MULTIPLIER[tier] : 1;

  return (
    <div>
      <AppHeader title="Performance Score" />
      <div className="px-4 pt-4">
        <div className="card flex items-center gap-3.5 p-3.5">
          <TierRing tier={tier} lg />
          <div className="text-left">
            <p className="row-title text-[15px]">{totalCases} cases handled</p>
            <p className="row-sub">
              {tier ? TIER_LABEL[tier] : "No NFT tier"} · {multiplier}x Agent2Mine multiplier
            </p>
          </div>
        </div>

        <div className="minibar">
          <span className="lbl">Conversion</span>
          <div className="track">
            <div className="fill" style={{ width: `${conversionRate}%` }} />
          </div>
          <span className="pct">{conversionRate}%</span>
        </div>

        <div className="card mt-1.5">
          <p className="row-title">Case volume ranking</p>
          <p className="row-sub">
            {rank > 0 ? `#${rank} of ${totalAgents} agents by case volume` : "No cases assigned yet"}
          </p>
        </div>

        <Link href="/nft-verification?return=/agent/score" className="btn secondary mt-2.5">
          {tier ? "Upgrade NFT Tier" : "Mint NFT to Raise Multiplier"}
        </Link>
      </div>
    </div>
  );
}
