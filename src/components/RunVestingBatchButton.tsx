"use client";

import { useTransition, useState } from "react";
import { runAxisPrestigeVestingBatch } from "@/app/actions/admin";

export function RunVestingBatchButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <div className="card">
      <p className="row-title mb-1">$AXIS token vesting</p>
      <p className="p-note mb-2">
        Credits every active node whatever has newly vested since the last run (cliff + daily linear vest,
        performance-accelerated), and freezes any node that has crossed the 25x realized-value cap.
      </p>
      {done ? (
        <p className="p-note text-[var(--green)]">Vesting processed.</p>
      ) : (
        <button
          className="btn primary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await runAxisPrestigeVestingBatch();
              setDone(true);
            })
          }
        >
          Run vesting batch
        </button>
      )}
    </div>
  );
}
