"use client";

import { useState, useTransition } from "react";
import { logAesRevenueContribution, runAesPoolDistribution } from "@/app/actions/admin";

const POOLS = [
  { target: "NODE_POOL_A" as const, label: "Pool A (1+ nodes)" },
  { target: "NODE_POOL_B" as const, label: "Pool B (5+ nodes)" },
  { target: "NODE_POOL_C" as const, label: "Pool C (10+ nodes)" },
];

export function AesRevenuePanel({
  balances,
}: {
  balances: Record<"NODE_POOL_A" | "NODE_POOL_B" | "NODE_POOL_C" | "BUYBACK_BURN" | "STRATEGIC_RESERVE" | "OPERATIONS", number>;
}) {
  const [revenue, setRevenue] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [logged, setLogged] = useState(false);

  return (
    <div className="card">
      <p className="row-title mb-1">AES net revenue → 6-way split</p>
      <p className="row-sub mb-2">
        Pool A ${balances.NODE_POOL_A.toLocaleString()} · Pool B ${balances.NODE_POOL_B.toLocaleString()} · Pool C $
        {balances.NODE_POOL_C.toLocaleString()} · Buyback ${balances.BUYBACK_BURN.toLocaleString()} · Reserve $
        {balances.STRATEGIC_RESERVE.toLocaleString()} · Ops ${balances.OPERATIONS.toLocaleString()}
      </p>

      {logged ? (
        <p className="p-note text-[var(--green)]">Logged and split across all six targets.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Real AES net revenue this period (USD)"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
          />
          <input
            placeholder="Note (e.g. Q1 2027 consolidated revenue)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
          />
          {error && <p className="p-note text-[var(--red)]">{error}</p>}
          <button
            className="btn ghost"
            style={{ padding: "8px 14px", fontSize: "11.5px" }}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await logAesRevenueContribution(Number(revenue), note);
                if (result?.error) setError(result.error);
                else setLogged(true);
              })
            }
          >
            Log contribution
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {POOLS.map((p) => (
          <PoolDistributeButton key={p.target} target={p.target} label={p.label} balance={balances[p.target]} />
        ))}
      </div>
    </div>
  );
}

function PoolDistributeButton({
  target,
  label,
  balance,
}: {
  target: "NODE_POOL_A" | "NODE_POOL_B" | "NODE_POOL_C";
  label: string;
  balance: number;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | undefined>();

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="p-note !mb-0">
        {label} — ${balance.toLocaleString()}
      </span>
      {result ? (
        <span className="p-note !mb-0 text-[var(--green)]">{result}</span>
      ) : (
        <button
          className="btn ghost"
          style={{ width: "auto", padding: "6px 12px", fontSize: "11px" }}
          disabled={pending || balance <= 0}
          onClick={() =>
            startTransition(async () => {
              const r = await runAesPoolDistribution(target);
              setResult(r?.error ?? "Distributed");
            })
          }
        >
          Distribute
        </button>
      )}
    </div>
  );
}
