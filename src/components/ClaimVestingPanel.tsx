"use client";

import { useActionState, useMemo, useState } from "react";
import { claimToVestingAction } from "@/app/actions/mining";

export interface LockTierOption {
  tier: "SIX_MONTH" | "ONE_YEAR" | "TWO_YEAR" | "THREE_YEAR";
  months: number;
  basePayoutPct: number;
  label: string;
}

export interface ScheduleRow {
  id: string;
  grossAmount: number;
  payoutAmount: number;
  lockTier: string;
  lockMonths: number;
  vestedToDate: number;
  fullyVested: boolean;
}

const TIER_LABEL: Record<string, string> = {
  SIX_MONTH: "6 months",
  ONE_YEAR: "1 year",
  TWO_YEAR: "2 years",
  THREE_YEAR: "3 years",
};

export function ClaimVestingPanel({
  claimableBalance,
  mpm,
  lockTiers,
  schedules,
}: {
  claimableBalance: number;
  mpm: number;
  lockTiers: LockTierOption[];
  schedules: ScheduleRow[];
}) {
  const [state, action, pending] = useActionState(claimToVestingAction, undefined);
  const [amount, setAmount] = useState("");
  const [selectedTier, setSelectedTier] = useState<LockTierOption["tier"]>("ONE_YEAR");

  const parsedAmount = Number(amount) || 0;
  const preview = useMemo(
    () =>
      lockTiers.map((t) => {
        const effectivePct = Math.min(1, t.basePayoutPct * mpm);
        return { ...t, effectivePct, payoutForAmount: parsedAmount * effectivePct };
      }),
    [lockTiers, mpm, parsedAmount]
  );

  const selected = preview.find((t) => t.tier === selectedTier);

  return (
    <div className="card !mb-0">
      <p className="row-title mb-1">Lock claimable $AXIS</p>
      <p className="p-note">
        Claimable $AXIS isn&apos;t spendable until it&apos;s locked into a term — longer locks release a bigger share
        of what you lock. Your Mining Power Multiplier ({mpm.toFixed(2)}x) boosts every tier&apos;s payout, capped at
        100%. Locked $AXIS vests out linearly, day by day, over the term.
      </p>

      <form action={action} className="mt-2 flex flex-col gap-2">
        <input
          type="number"
          name="amount"
          step="0.01"
          min="0"
          max={claimableBalance}
          placeholder={`Amount to lock (max ${claimableBalance.toLocaleString()})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
        />
        <input type="hidden" name="lockTier" value={selectedTier} />

        <div className="grid grid-cols-2 gap-2">
          {preview.map((t) => (
            <button
              key={t.tier}
              type="button"
              onClick={() => setSelectedTier(t.tier)}
              className="rounded-[10px] border px-3 py-2 text-left text-[11.5px] font-semibold"
              style={{
                borderColor: t.tier === selectedTier ? "var(--gold)" : "var(--gold-border)",
                background: t.tier === selectedTier ? "var(--card2)" : "transparent",
                color: "white",
              }}
            >
              <div>{t.label}</div>
              <div className="text-[var(--gold)]">{Math.round(t.effectivePct * 100)}% payout</div>
              {parsedAmount > 0 && (
                <div className="p-note !mb-0 !mt-0.5">
                  → {t.payoutForAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} $AXIS
                </div>
              )}
            </button>
          ))}
        </div>

        {state?.error && <p className="text-[11px] font-semibold text-red-400">{state.error}</p>}
        {state?.ok && <p className="text-[11px] font-semibold text-[var(--green)]">Locked into a {selected ? TIER_LABEL[selected.tier] : ""} vesting schedule.</p>}

        <button
          className="btn secondary"
          type="submit"
          disabled={pending || claimableBalance <= 0}
        >
          {pending ? "Locking…" : "Lock $AXIS"}
        </button>
      </form>

      {schedules.length > 0 && (
        <div className="mt-3">
          <p className="eyebrow mb-1">Your vesting schedules</p>
          {schedules.map((s) => (
            <div key={s.id} className="row">
              <div className="min-w-0 flex-1">
                <p className="row-title">
                  {TIER_LABEL[s.lockTier]} · {s.grossAmount.toLocaleString()} $AXIS locked
                </p>
                <p className="row-sub">
                  {s.vestedToDate.toLocaleString(undefined, { maximumFractionDigits: 2 })} /{" "}
                  {s.payoutAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} $AXIS vested
                  {s.fullyVested ? " — fully vested" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
