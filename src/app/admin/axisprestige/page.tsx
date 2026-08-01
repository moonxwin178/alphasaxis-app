import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { AdminNodeClaimRow } from "@/components/AdminNodeClaimRow";
import { AxisPrestigePoolPanel } from "@/components/AxisPrestigePoolPanel";
import { RunVestingBatchButton } from "@/components/RunVestingBatchButton";
import { AdminNodeVestingRow } from "@/components/AdminNodeVestingRow";
import { getPrestigePoolBalance, getVerifiedPrestigeNodes } from "@/lib/axisPrestigeRevenue";
import { computeVestedTokens, getRealizedValueTotal, EARLY_BACKERS_POOL_TOKENS } from "@/lib/axisPrestigeVesting";
import { getLiquidityReserveBalance } from "@/lib/liquidityReserve";
import { LiquidityReservePanel } from "@/components/LiquidityReservePanel";

export default async function AdminAxisPrestigePage() {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const [pendingClaims, poolBalance, verifiedNodes, nodeVestings, liquidityBalance] = await Promise.all([
    prisma.nftHolding.findMany({
      where: { tier: "AXIS_PRESTIGE", verificationStatus: "PENDING" },
      include: { user: { select: { name: true } } },
      orderBy: { mintedAt: "asc" },
    }),
    getPrestigePoolBalance(),
    getVerifiedPrestigeNodes(),
    prisma.axisPrestigeNodeVesting.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getLiquidityReserveBalance(),
  ]);

  const now = new Date();
  const rows = await Promise.all(
    nodeVestings.map(async (n) => {
      const realizedUsd = await getRealizedValueTotal(n.userId);
      const vestedTokens = computeVestedTokens(
        {
          allocationTokens: Number(n.allocationTokens),
          verifiedAt: n.verifiedAt,
          cliffMonths: n.cliffMonths,
          vestingMonths: n.vestingMonths,
          performanceMultiplier: n.performanceMultiplier,
        },
        now
      );
      const cliffEndsAt = new Date(n.verifiedAt.getTime() + n.cliffMonths * 30.44 * 24 * 60 * 60 * 1000);
      const status = now < cliffEndsAt ? "In cliff" : vestedTokens >= Number(n.allocationTokens) ? "Fully vested" : "Vesting";
      return { node: n, vestedTokens, realizedUsd, status };
    })
  );

  return (
    <div>
      <AppHeader title="AxisPrestige" backHref="/admin/users" />
      <div className="px-4 pt-4">
        {pendingClaims.length > 0 && (
          <>
            <p className="eyebrow">Pending node claims</p>
            {pendingClaims.map((c) => (
              <AdminNodeClaimRow key={c.id} nftHoldingId={c.id} name={c.user.name} walletAddress={c.walletAddress} />
            ))}
          </>
        )}

        <p className="eyebrow mt-2">Liquidity</p>
        <LiquidityReservePanel balance={liquidityBalance} />

        <p className="eyebrow mt-2">Revenue share (USD/USDT)</p>
        <AxisPrestigePoolPanel poolBalance={poolBalance} nodeCount={verifiedNodes.length} />

        <p className="eyebrow mt-2">$AXIS token vesting</p>
        <div className="card">
          <p className="row-title mb-1">Token allocation pool</p>
          <p className="row-sub">
            {EARLY_BACKERS_POOL_TOKENS.toLocaleString()} $AXIS Early Backers allocation · 5,000,000 $AXIS per node
            ($500 at $0.0001) · 6-month cliff, 5-year daily vest, 25x realized-value burn cap
          </p>
        </div>
        <RunVestingBatchButton />

        {rows.length === 0 && <p className="p-note">No verified nodes yet.</p>}
        {rows.map(({ node, vestedTokens, realizedUsd, status }) => (
          <AdminNodeVestingRow
            key={node.id}
            nodeVestingId={node.id}
            userId={node.userId}
            name={node.user.name}
            vestedTokens={vestedTokens}
            allocationTokens={Number(node.allocationTokens)}
            performanceMultiplier={node.performanceMultiplier}
            realizedUsd={realizedUsd}
            burned={node.burned}
            status={status}
          />
        ))}
      </div>
    </div>
  );
}
