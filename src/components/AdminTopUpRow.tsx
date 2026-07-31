"use client";

import { useTransition } from "react";
import { reviewTopUp } from "@/app/actions/wallet";

export function AdminTopUpRow({
  requestId,
  name,
  amountUsd,
  method,
  note,
}: {
  requestId: string;
  name: string;
  amountUsd: number;
  method: string;
  note: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="row">
        <div className="row-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="row-title">{name}</p>
          <p className="row-sub">
            ${amountUsd.toLocaleString()} via {method === "RM" ? "bank transfer" : "USDT deposit"}
            {note ? ` — ${note}` : ""}
          </p>
        </div>
      </div>
      <div className="grid2 mt-[-4px] mb-2.5">
        <button
          className="btn ghost"
          style={{ fontSize: "11.5px", padding: 8 }}
          disabled={pending}
          onClick={() => startTransition(() => { void reviewTopUp(requestId, true); })}
        >
          Confirm Payment
        </button>
        <button
          className="btn ghost"
          style={{ fontSize: "11.5px", padding: 8, color: "var(--red)" }}
          disabled={pending}
          onClick={() => startTransition(() => { void reviewTopUp(requestId, false); })}
        >
          Reject
        </button>
      </div>
    </>
  );
}
