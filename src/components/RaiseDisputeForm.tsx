"use client";

import { useActionState, useState } from "react";
import { raiseDispute } from "@/app/actions/dispute";

export function RaiseDisputeForm({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(raiseDispute, undefined);

  if (state?.ok) {
    return <p className="p-note text-[var(--green)]">Reported — our team will follow up.</p>;
  }

  if (!open) {
    return (
      <button className="btn ghost mt-2" onClick={() => setOpen(true)}>
        Report an Issue
      </button>
    );
  }

  return (
    <form action={action} className="card mt-2">
      <input type="hidden" name="caseId" value={caseId} />
      <div className="field">
        <label htmlFor="note">What&apos;s wrong?</label>
        <textarea
          id="note"
          name="note"
          required
          rows={3}
          className="w-full rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2.5 text-[13px] text-white"
        />
      </div>
      {state?.error && <p className="mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Submit Report"}
      </button>
    </form>
  );
}
