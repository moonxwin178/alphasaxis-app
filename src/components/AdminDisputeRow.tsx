"use client";

import { useState, useTransition } from "react";
import { resolveDispute } from "@/app/actions/admin";

export function AdminDisputeRow({
  disputeId,
  raisedBy,
  note,
  status,
}: {
  disputeId: string;
  raisedBy: string;
  note: string;
  status: string;
}) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [resolved, setResolved] = useState(status === "RESOLVED");

  return (
    <div className="card">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="row-title">{raisedBy}</p>
        <span className={`badge ${resolved ? "green" : "amber"}`}>{resolved ? "Resolved" : "Open"}</span>
      </div>
      <p className="row-sub mb-2">{note}</p>
      {!resolved && (
        <>
          <input
            type="text"
            placeholder="Resolution note"
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            className="mb-2 w-full rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] text-white"
          />
          <button
            className="btn ghost"
            style={{ fontSize: "11.5px", padding: 8 }}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await resolveDispute(disputeId, resolutionNote);
                setResolved(true);
              })
            }
          >
            Mark as Resolved
          </button>
        </>
      )}
    </div>
  );
}
