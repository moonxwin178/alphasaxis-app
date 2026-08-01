"use client";

import { useTransition, useState } from "react";
import { reviewNodeVerification } from "@/app/actions/admin";

export function AdminNodeClaimRow({
  nftHoldingId,
  name,
  walletAddress,
}: {
  nftHoldingId: string;
  name: string;
  walletAddress: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"approved" | "rejected" | undefined>();

  if (done) {
    return (
      <div className="row">
        <div className="min-w-0 flex-1">
          <p className="row-title">{name}</p>
        </div>
        <span className={done === "approved" ? "badge green" : "badge red"}>
          {done === "approved" ? "Verified" : "Rejected"}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-2.5">
      <div className="row">
        <div className="min-w-0 flex-1">
          <p className="row-title">{name}</p>
          <p className="row-sub">
            {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "No wallet on file"}
          </p>
        </div>
      </div>
      <div className="grid2 mt-[-4px]">
        <button
          className="btn ghost"
          style={{ fontSize: "11.5px", padding: 8 }}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await reviewNodeVerification(nftHoldingId, true);
              setDone("approved");
            })
          }
        >
          Verify node
        </button>
        <button
          className="btn ghost"
          style={{ fontSize: "11.5px", padding: 8, color: "var(--red)" }}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await reviewNodeVerification(nftHoldingId, false);
              setDone("rejected");
            })
          }
        >
          Reject
        </button>
      </div>
    </div>
  );
}
