"use client";

import { useActionState } from "react";
import { submitSpendProof } from "@/app/actions/earn";

export function SpendProofForm() {
  const [state, action, pending] = useActionState(submitSpendProof, undefined);

  return (
    <form action={action} className="card">
      <div className="field">
        <label htmlFor="receipt">Upload receipt photo</label>
        <input id="receipt" name="receipt" type="file" accept="image/jpeg,image/png,application/pdf" required />
      </div>
      {state?.error && <p className="mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
      {state?.ok && <p className="mb-2 text-[11px] font-semibold text-[var(--green)]">Submitted for review.</p>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Submit for Review"}
      </button>
    </form>
  );
}
