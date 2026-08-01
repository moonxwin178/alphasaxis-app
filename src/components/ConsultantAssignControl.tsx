"use client";

import { useState, useTransition } from "react";
import { setCaseServicing } from "@/app/actions/admin";

export function ConsultantAssignControl({
  caseId,
  consultants,
}: {
  caseId: string;
  consultants: { id: string; name: string }[];
}) {
  const [mode, setMode] = useState<"SELF_SERVICED" | "NEEDS_CONSULTANT">("SELF_SERVICED");
  const [selected, setSelected] = useState(consultants[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="p-note text-[var(--green)]">Servicing decided.</p>;
  }

  return (
    <div className="mb-2.5 flex flex-col gap-2">
      <div className="grid2">
        <button
          type="button"
          className={mode === "SELF_SERVICED" ? "btn secondary" : "btn ghost"}
          style={{ fontSize: "11.5px", padding: 8 }}
          onClick={() => setMode("SELF_SERVICED")}
        >
          Self-serviced
        </button>
        <button
          type="button"
          className={mode === "NEEDS_CONSULTANT" ? "btn secondary" : "btn ghost"}
          style={{ fontSize: "11.5px", padding: 8 }}
          onClick={() => setMode("NEEDS_CONSULTANT")}
        >
          Needs consultant
        </button>
      </div>

      {mode === "NEEDS_CONSULTANT" && (
        consultants.length === 0 ? (
          <p className="p-note">No loan consultant accounts yet.</p>
        ) : (
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="min-w-0 flex-1 rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
          >
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )
      )}

      {error && <p className="p-note text-[var(--red)]">{error}</p>}

      <button
        className="btn ghost"
        style={{ padding: "8px 14px", fontSize: "11.5px" }}
        disabled={pending || (mode === "NEEDS_CONSULTANT" && consultants.length === 0)}
        onClick={() =>
          startTransition(async () => {
            const result = await setCaseServicing(caseId, mode, mode === "NEEDS_CONSULTANT" ? selected : undefined);
            if (result?.error) setError(result.error);
            else setDone(true);
          })
        }
      >
        Confirm servicing
      </button>
    </div>
  );
}
