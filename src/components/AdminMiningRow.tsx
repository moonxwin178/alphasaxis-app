"use client";

import { useTransition, useState } from "react";
import { reviewMiningSubmission } from "@/app/actions/admin";

export function AdminMiningRow({
  submissionId,
  title,
  sub,
  depositValueRm,
}: {
  submissionId: string;
  title: string;
  sub: string;
  depositValueRm: number;
}) {
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
        <p className="p-note !mb-0">Approving deposits RM {depositValueRm.toLocaleString()} worth of $AXIS into their mining pool.</p>
        {error && <p className="p-note text-[var(--red)]">{error}</p>}
        <div className="grid2">
          <button
            className="btn ghost"
            style={{ fontSize: "11.5px", padding: 8 }}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await reviewMiningSubmission(submissionId, "approve");
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
