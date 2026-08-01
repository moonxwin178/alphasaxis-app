"use client";

import { useState, useTransition } from "react";
import { setNodePerformanceMultiplier, recordRealizedValue } from "@/app/actions/admin";

export function AdminNodeVestingRow({
  nodeVestingId,
  userId,
  name,
  vestedTokens,
  allocationTokens,
  performanceMultiplier,
  realizedUsd,
  burned,
  status,
}: {
  nodeVestingId: string;
  userId: string;
  name: string;
  vestedTokens: number;
  allocationTokens: number;
  performanceMultiplier: number;
  realizedUsd: number;
  burned: boolean;
  status: string;
}) {
  const [multiplier, setMultiplier] = useState(String(performanceMultiplier));
  const [multPending, startMult] = useTransition();

  const [realizedAmount, setRealizedAmount] = useState("");
  const [realizedSource, setRealizedSource] = useState<"TOKEN_SALE" | "MARKETPLACE_REDEMPTION">("TOKEN_SALE");
  const [realizedNote, setRealizedNote] = useState("");
  const [realizedPending, startRealized] = useTransition();
  const [realizedError, setRealizedError] = useState<string | undefined>();

  return (
    <div className="card">
      <p className="row-title mb-1">{name}</p>
      <p className="row-sub mb-2">
        {vestedTokens.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {allocationTokens.toLocaleString()}{" "}
        $AXIS vested · ${realizedUsd.toLocaleString()} realized ·{" "}
        {burned ? <span className="badge red">Burned</span> : <span className="badge amber">{status}</span>}
      </p>

      {!burned && (
        <>
          <div className="mb-2 flex gap-2">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              className="min-w-0 flex-1 rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
            />
            <button
              className="btn ghost"
              style={{ width: "auto", padding: "8px 14px", fontSize: "11.5px" }}
              disabled={multPending}
              onClick={() => startMult(() => { void setNodePerformanceMultiplier(nodeVestingId, Number(multiplier)); })}
            >
              Set multiplier
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <select
              value={realizedSource}
              onChange={(e) => setRealizedSource(e.target.value as typeof realizedSource)}
              className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
            >
              <option value="TOKEN_SALE">Token sale (cashed out for USDT)</option>
              <option value="MARKETPLACE_REDEMPTION">Marketplace redemption</option>
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Realized amount (USD)"
              value={realizedAmount}
              onChange={(e) => setRealizedAmount(e.target.value)}
              className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
            />
            <input
              placeholder="Note"
              value={realizedNote}
              onChange={(e) => setRealizedNote(e.target.value)}
              className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
            />
            {realizedError && <p className="p-note text-[var(--red)]">{realizedError}</p>}
            <button
              className="btn ghost"
              style={{ padding: "8px 14px", fontSize: "11.5px" }}
              disabled={realizedPending}
              onClick={() =>
                startRealized(async () => {
                  const result = await recordRealizedValue(userId, Number(realizedAmount), realizedSource, realizedNote);
                  if (result?.error) setRealizedError(result.error);
                  else {
                    setRealizedError(undefined);
                    setRealizedAmount("");
                    setRealizedNote("");
                  }
                })
              }
            >
              Log realized value
            </button>
          </div>
        </>
      )}
    </div>
  );
}
