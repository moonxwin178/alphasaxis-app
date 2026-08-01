import "server-only";

/**
 * Region gating for Agent2Mine's Spend-to-Earn / Submit-to-Earn tasks
 * (petrol-subsidy receipts, Meta Ads onboarding). Malaysia is the launch
 * market; deliberately a plain list (not a hardcoded check) so opening up
 * more of Southeast Asia later is a one-line change, not a schema change.
 *
 * Network-to-Earn (referrals) and Social-to-Earn (check-ins) are NOT
 * gated — $AXIS itself is on-chain and not country-bound, so anyone who
 * sees value in AlphasAxis can participate in those. Only the
 * task-specific mining categories (currently Malaysia-only real-world
 * programs) are restricted.
 */
export const ALLOWED_MINING_COUNTRIES = ["Malaysia"] as const;

export function isCountryAllowedForMining(nationality: string | null | undefined): boolean {
  if (!nationality) return false;
  return (ALLOWED_MINING_COUNTRIES as readonly string[]).includes(nationality);
}
