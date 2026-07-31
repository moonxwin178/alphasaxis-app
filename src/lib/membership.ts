export const MEMBERSHIP_PRICE_USDT: Record<"AGENT" | "AGENCY", number> = {
  AGENT: 500,
  AGENCY: 5000,
};

export const REFERRAL_COMMISSION_RATE = {
  TIER_1: 0.1, // direct referrer
  TIER_2: 0.05, // referrer's referrer
} as const;
