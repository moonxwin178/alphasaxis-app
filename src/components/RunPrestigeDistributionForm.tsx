"use client";

import { useState, useTransition } from "react";
import { runAxisPrestigeDistribution } from "@/app/actions/admin";

export function RunPrestigeDistributionForm({ nodeCount }: { nodeCount: number }) {
  const [quarterLabel, setQuarterLabel] = useState("");
  const [total, setTotal] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  const perNode = Number(total) > 0 && nodeCount > 0 ? Number(total) / nodeCount : 0;

  if (done) {
    return <p className="p-note text-[var(--green)]">Distribution recorded and credited to node holders.</p>;
  }

  return (
    <div className="card">
      <p className="row-title mb-1">Run a quarterly distribution</p>
      <p className="p-note mb-2">{nodeCount} verified AxisPrestige node(s) currently eligible.</p>
      <div className="field">
        <label htmlFor="quarterLabel">Quarter label</label>
        <input
          id="quarterLabel"
          placeholder="Q1 2027"
          value={quarterLabel}
          onChange={(e) => setQuarterLabel(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="total">Total $AXIS to distribute this quarter</label>
        <input id="total" type="number" step="0.0001" min="0" value={total} onChange={(e) => setTotal(e.target.value)} />
      </div>
      {perNode > 0 && <p className="p-note mb-2">≈ {perNode.toLocaleString()} $AXIS per node.</p>}
      {error && <p className="p-note text-[var(--red)]">{error}</p>}
      <button
        className="btn primary"
        disabled={pending || nodeCount === 0}
        onClick={() =>
          startTransition(async () => {
            const result = await runAxisPrestigeDistribution(quarterLabel, Number(total));
            if (result?.error) setError(result.error);
            else setDone(true);
          })
        }
      >
        Distribute
      </button>
    </div>
  );
}
