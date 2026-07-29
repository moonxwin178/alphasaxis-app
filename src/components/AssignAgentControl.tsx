"use client";

import { useState, useTransition } from "react";
import { assignAgentToCase } from "@/app/actions/admin";

export function AssignAgentControl({
  caseId,
  agents,
}: {
  caseId: string;
  agents: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState(agents[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (agents.length === 0) {
    return <p className="p-note">No agents available to assign yet.</p>;
  }
  if (done) {
    return <p className="p-note text-[var(--green)]">Agent assigned.</p>;
  }

  return (
    <div className="mb-2.5 flex gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="min-w-0 flex-1 rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
      >
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <button
        className="btn ghost"
        style={{ width: "auto", padding: "8px 14px", fontSize: "11.5px" }}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await assignAgentToCase(caseId, selected);
            setDone(true);
          })
        }
      >
        Assign
      </button>
    </div>
  );
}
