"use client";

import { useState, useTransition } from "react";
import { logNodeSaleLiquidityContribution } from "@/app/actions/admin";

export function LiquidityReservePanel({ balance }: { balance: number }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="card">
      <p className="row-title mb-1">Liquidity reserve</p>
      <p className="row-sub mb-2">
        ${balance.toLocaleString()} accumulated — dedicated to seeding $AXIS/USDT and $AXIS/PLS DEX pools, kept
        separate from general treasury.
      </p>

      <p className="eyebrow mb-1">Log a node-sale proceeds contribution</p>
      <div className="flex flex-col gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount (USD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
        />
        <input
          placeholder="Note (e.g. Node sale round 1, 12% of $2.5M raise)"
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
              const result = await logNodeSaleLiquidityContribution(Number(amount), note);
              if (result?.error) setError(result.error);
              else {
                setError(undefined);
                setAmount("");
                setNote("");
              }
            })
          }
        >
          Add to reserve
        </button>
      </div>
    </div>
  );
}
