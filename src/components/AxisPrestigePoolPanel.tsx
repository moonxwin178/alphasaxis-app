"use client";

import { useState, useTransition } from "react";
import { contributeAxisPrestigeRevenue, runAxisPrestigeRevenueDistribution } from "@/app/actions/admin";

export function AxisPrestigePoolPanel({ poolBalance, nodeCount }: { poolBalance: number; nodeCount: number }) {
  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [contribPending, startContrib] = useTransition();
  const [contribError, setContribError] = useState<string | undefined>();

  const [label, setLabel] = useState("");
  const [distAmount, setDistAmount] = useState("");
  const [distPending, startDist] = useTransition();
  const [distError, setDistError] = useState<string | undefined>();
  const [distDone, setDistDone] = useState(false);

  const perNode = Number(distAmount) > 0 && nodeCount > 0 ? Number(distAmount) / nodeCount : 0;

  return (
    <>
      <div className="card">
        <p className="row-title mb-1">Revenue pool</p>
        <p className="row-sub mb-2">${poolBalance.toLocaleString()} available · {nodeCount} verified node(s)</p>

        <p className="eyebrow mb-1">Log a converted case&apos;s contribution</p>
        <div className="flex flex-col gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount (USD)"
            value={contribAmount}
            onChange={(e) => setContribAmount(e.target.value)}
            className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
          />
          <input
            placeholder="Note (e.g. case reference)"
            value={contribNote}
            onChange={(e) => setContribNote(e.target.value)}
            className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
          />
          {contribError && <p className="p-note text-[var(--red)]">{contribError}</p>}
          <button
            className="btn ghost"
            style={{ padding: "8px 14px", fontSize: "11.5px" }}
            disabled={contribPending}
            onClick={() =>
              startContrib(async () => {
                const result = await contributeAxisPrestigeRevenue(Number(contribAmount), null, contribNote);
                if (result?.error) setContribError(result.error);
                else {
                  setContribError(undefined);
                  setContribAmount("");
                  setContribNote("");
                }
              })
            }
          >
            Add to pool
          </button>
        </div>
      </div>

      <div className="card">
        <p className="row-title mb-2">Run a quarterly revenue distribution</p>
        {distDone ? (
          <p className="p-note text-[var(--green)]">Distributed and credited to node holder wallets.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              placeholder="Q1 2027"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount to distribute (USD)"
              value={distAmount}
              onChange={(e) => setDistAmount(e.target.value)}
              className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
            />
            {perNode > 0 && <p className="p-note">≈ ${perNode.toLocaleString()} per node.</p>}
            {distError && <p className="p-note text-[var(--red)]">{distError}</p>}
            <button
              className="btn primary"
              disabled={distPending || nodeCount === 0}
              onClick={() =>
                startDist(async () => {
                  const result = await runAxisPrestigeRevenueDistribution(label, Number(distAmount));
                  if (result?.error) setDistError(result.error);
                  else setDistDone(true);
                })
              }
            >
              Distribute
            </button>
          </div>
        )}
      </div>
    </>
  );
}
