"use client";

import { useState, useTransition } from "react";
import { disburseCase } from "@/app/actions/admin";

export function DisburseCaseControl({ caseId }: { caseId: string }) {
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="p-note text-[var(--green)]">Disbursed — commission split generated.</p>;
  }

  return (
    <div className="mb-2.5 flex flex-col gap-2">
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder="Gross commission (RM)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
      />
      {error && <p className="p-note text-[var(--red)]">{error}</p>}
      <button
        className="btn secondary"
        style={{ padding: "8px 14px", fontSize: "11.5px" }}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await disburseCase(caseId, Number(amount));
            if (result?.error) setError(result.error);
            else setDone(true);
          })
        }
      >
        Disburse commission
      </button>
    </div>
  );
}
