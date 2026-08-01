"use client";

import { useState, useTransition } from "react";
import { reviewMiningSubmission } from "@/app/actions/admin";

export function AdminMiningRow({
  submissionId,
  title,
  sub,
  suggestedAmount,
}: {
  submissionId: string;
  title: string;
  sub: string;
  suggestedAmount: number;
}) {
  const [amount, setAmount] = useState(String(suggestedAmount.toFixed(2)));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState<"approved" | "rejected" | undefined>();

  if (done) {
    return (
      <div className="row">
        <div className="min-w-0 flex-1">
          <p className="row-title">{title}</p>
        </div>
        <span className={done === "approved" ? "badge green" : "badge red"}>
          {done === "approved" ? "Approved" : "Rejected"}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-2.5">
      <div className="row">
        <div className="min-w-0 flex-1">
          <p className="row-title">{title}</p>
          <p className="row-sub">{sub}</p>
        </div>
      </div>
      <div className="mt-[-4px] flex flex-col gap-2">
        <input
          type="number"
          step="0.0001"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
        />
        {error && <p className="p-note text-[var(--red)]">{error}</p>}
        <div className="grid2">
          <button
            className="btn ghost"
            style={{ fontSize: "11.5px", padding: 8 }}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await reviewMiningSubmission(submissionId, "approve", Number(amount));
                if (result?.error) setError(result.error);
                else setDone("approved");
              })
            }
          >
            Approve
          </button>
          <button
            className="btn ghost"
            style={{ fontSize: "11.5px", padding: 8, color: "var(--red)" }}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await reviewMiningSubmission(submissionId, "reject");
                setDone("rejected");
              })
            }
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
