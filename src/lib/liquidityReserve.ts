import "server-only";
import { getPrisma } from "./prisma";

/**
 * Dedicated DEX liquidity war chest — kept separate from general treasury so
 * it's never spent on anything else. Funded from two confirmed sources:
 * a cut of every Agent/Agency mint fee (automatic, see contributeMintFeeShare),
 * and a share of AxisPrestige node-sale proceeds (manual, since that $500/node
 * sale happens off-platform on turbox.bond — see contributeNodeSaleShare).
 */

// 25% of the NET mint fee (after the 15% referral payout) — a disciplined,
// automatic slice rather than an ad-hoc "whatever's left" decision.
export const MINT_FEE_LIQUIDITY_SHARE = 0.25;

export async function getLiquidityReserveBalance(): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.liquidityReserveEntry.aggregate({ _sum: { amountUsd: true } });
  return Number(result._sum.amountUsd ?? 0);
}

/** Manually logged by an admin once real off-platform node-sale figures are known. */
export async function contributeNodeSaleShare(amountUsd: number, note: string, createdById: string): Promise<void> {
  const prisma = getPrisma();
  await prisma.liquidityReserveEntry.create({
    data: { amountUsd, source: "NODE_SALE_ALLOCATION", note, createdById },
  });
}
