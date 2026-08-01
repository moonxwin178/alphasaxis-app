/**
 * Multi-party commission distribution engine.
 *
 * Replaces the old flat `computeCommission()` placeholder (single agent,
 * no SST, no overriding) with the real AES branch-agency model: SST off the
 * top, a flat 30% to AES, a tier-dependent team share (50/60/70%), the
 * unclaimed gap between team-share and AxisPro's "top" 70% banked to the
 * AlphasAxis Treasury, a role-based split of the team's share (Lead
 * Provider / Caller / Closer), and — for AxisOne/AxisPro introducers only —
 * a 14% overriding carved out of AES's 30% and paid to the introducer,
 * their upline, the platform, and whoever closed the deal.
 *
 * Every rate here is a real, confirmed business rule, not a placeholder —
 * see the worked RM50,000 example this was verified against.
 */

export type BrokerageTier = "AXIS_ZERO" | "AXIS_ONE" | "AXIS_PRO";

const SST_RATE = 0.08;
const AES_RATE = 0.3; // flat, regardless of introducer tier

// Team share by introducer tier. AxisPro (0.7) is "the top" — 0.7 + AES_RATE
// (0.3) = 100%, so Pro-sourced deals have no Treasury gap. Lower tiers leave
// a gap (Zero: 20%, One: 10%) that's banked to Treasury, not paid to AES.
const TEAM_SHARE_RATE: Record<BrokerageTier, number> = {
  AXIS_ZERO: 0.5,
  AXIS_ONE: 0.6,
  AXIS_PRO: 0.7,
};

const ROLE_SPLIT = { leadProvider: 0.4, caller: 0.2, closer: 0.4 } as const;

// The 14% overriding, carved out of AES's 30%, sized off the team's share.
// AxisZero introducers don't participate — see confirmed rule.
const OVERRIDE_RATE = {
  introducer: 0.03,
  upline: 0.03,
  platform: 0.05,
  consultant: 0.03,
} as const;

export type CommissionLineRole =
  | "AES"
  | "TREASURY"
  | "LEAD_PROVIDER"
  | "CALLER"
  | "CLOSER"
  | "OVERRIDE_INTRODUCER"
  | "OVERRIDE_UPLINE"
  | "OVERRIDE_PLATFORM"
  | "OVERRIDE_CONSULTANT";

export interface CommissionLineItem {
  role: CommissionLineRole;
  /** null for house lines (AES, Treasury, platform cut) — no user recipient. */
  recipientId: string | null;
  amount: number;
}

export interface CommissionDistributionInput {
  grossCommission: number;
  introducerTier: BrokerageTier;
  /** Always the introducer — the person who referred the lead. */
  leadProviderId: string;
  /** Same as leadProviderId if the introducer made the call themselves. */
  callerId: string;
  /** Same as leadProviderId if the introducer closed the deal themselves. */
  closerId: string;
  /**
   * Resolved recipient for the upline's 3% — the introducer's real upline,
   * OR the introducer themselves if their recorded upline is the Grand
   * Master 001 placeholder account (confirmed rule: 001 never personally
   * receives an override — it redirects back to the introducer).
   */
  uplineRecipientId: string;
}

export interface CommissionDistributionResult {
  grossCommission: number;
  sstAmount: number;
  netAfterSst: number;
  teamShare: number;
  aesShare: number;
  aesNetShare: number;
  treasuryShare: number;
  isSelfClosed: boolean;
  overridingApplies: boolean;
  lineItems: CommissionLineItem[];
}

export function computeCommissionDistribution(
  input: CommissionDistributionInput
): CommissionDistributionResult {
  const { grossCommission, introducerTier, leadProviderId, callerId, closerId, uplineRecipientId } = input;

  const sstAmount = grossCommission * SST_RATE;
  const netAfterSst = grossCommission - sstAmount;
  const teamShare = netAfterSst * TEAM_SHARE_RATE[introducerTier];
  const aesShare = netAfterSst * AES_RATE;
  const treasuryShare = netAfterSst * (1 - TEAM_SHARE_RATE[introducerTier] - AES_RATE);

  const isSelfClosed = leadProviderId === callerId && callerId === closerId;
  const lineItems: CommissionLineItem[] = [];

  if (isSelfClosed) {
    lineItems.push({ role: "LEAD_PROVIDER", recipientId: leadProviderId, amount: round2(teamShare) });
  } else {
    lineItems.push({ role: "LEAD_PROVIDER", recipientId: leadProviderId, amount: round2(teamShare * ROLE_SPLIT.leadProvider) });
    lineItems.push({ role: "CALLER", recipientId: callerId, amount: round2(teamShare * ROLE_SPLIT.caller) });
    lineItems.push({ role: "CLOSER", recipientId: closerId, amount: round2(teamShare * ROLE_SPLIT.closer) });
  }

  const overridingApplies = introducerTier !== "AXIS_ZERO";
  let overridingTotal = 0;

  if (overridingApplies) {
    const party1 = teamShare * OVERRIDE_RATE.introducer;
    const party2 = teamShare * OVERRIDE_RATE.upline;
    const party3 = teamShare * OVERRIDE_RATE.platform;
    const party4 = teamShare * OVERRIDE_RATE.consultant;
    const party4Recipient = isSelfClosed ? leadProviderId : closerId;

    lineItems.push({ role: "OVERRIDE_INTRODUCER", recipientId: leadProviderId, amount: round2(party1) });
    lineItems.push({ role: "OVERRIDE_UPLINE", recipientId: uplineRecipientId, amount: round2(party2) });
    lineItems.push({ role: "OVERRIDE_PLATFORM", recipientId: null, amount: round2(party3) });
    lineItems.push({ role: "OVERRIDE_CONSULTANT", recipientId: party4Recipient, amount: round2(party4) });

    overridingTotal = party1 + party2 + party3 + party4;
  }

  const aesNetShare = aesShare - overridingTotal;
  lineItems.push({ role: "AES", recipientId: null, amount: round2(aesNetShare) });
  if (treasuryShare > 0) {
    lineItems.push({ role: "TREASURY", recipientId: null, amount: round2(treasuryShare) });
  }

  return {
    grossCommission,
    sstAmount: round2(sstAmount),
    netAfterSst: round2(netAfterSst),
    teamShare: round2(teamShare),
    aesShare: round2(aesShare),
    aesNetShare: round2(aesNetShare),
    treasuryShare: round2(treasuryShare),
    isSelfClosed,
    overridingApplies,
    lineItems,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
