// Pure pricing constants shared between server logic (mintCycle.ts) and
// client UI (RoleApplicationForm.tsx). Deliberately has no "server-only" or
// Prisma import — pulling those into a client bundle breaks the build (see
// mintCycle.ts, which carries the actual payment logic and stays server-only).
const ANCHOR_PRICE_USD = 0.0005;
export const MEMBERSHIP_PRICE_USDT: Record<"AGENT" | "AGENCY", number> = { AGENT: 500, AGENCY: 5000 };

export const MINT_PRICE_AXIS: Record<"AGENT" | "AGENCY", number> = {
  AGENT: MEMBERSHIP_PRICE_USDT.AGENT / ANCHOR_PRICE_USD, // 1,000,000
  AGENCY: MEMBERSHIP_PRICE_USDT.AGENCY / ANCHOR_PRICE_USD, // 10,000,000
};
