"use client";

import { useTransition } from "react";
import { approveCommission, approveAllPendingCommissions } from "@/app/actions/admin";

interface CommissionRow {
  id: string;
  agentName: string;
  caseRef: string;
  amount: number;
}

export function AdminPayoutsPanel({ pending }: { pending: CommissionRow[] }) {
  const [transitionPending, startTransition] = useTransition();

  if (pending.length === 0) {
    return (
      <div className="card text-center" style={{ borderColor: "rgba(143,201,143,.4)" }}>
        <p className="m-0 font-extrabold text-[var(--green)]">No pending payouts.</p>
      </div>
    );
  }

  return (
    <>
      {pending.map((c) => (
        <div key={c.id} className="row">
          <div className="row-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
              <rect x="3" y="8" width="18" height="4" />
              <rect x="5" y="12" width="14" height="9" />
              <path d="M12 8v13" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">{c.agentName}</p>
            <p className="row-sub">{c.caseRef}</p>
          </div>
          <button
            className="row-right cursor-pointer bg-transparent"
            disabled={transitionPending}
            onClick={() => startTransition(() => { void approveCommission(c.id); })}
          >
            RM {c.amount.toLocaleString()}
          </button>
        </div>
      ))}
      <button
        className="btn primary mt-2"
        disabled={transitionPending}
        onClick={() => startTransition(() => { void approveAllPendingCommissions(); })}
      >
        Approve All
      </button>
    </>
  );
}
