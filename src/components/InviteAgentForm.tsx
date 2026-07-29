"use client";

import { useActionState } from "react";
import { inviteAgentToAgency } from "@/app/actions/agency";

export function InviteAgentForm() {
  const [state, action, pending] = useActionState(inviteAgentToAgency, undefined);

  return (
    <form action={action} className="card">
      <p className="row-title mb-2">Invite an agent</p>
      <p className="p-note">The agent must already have an approved AlphasAxis agent account.</p>
      <div className="field">
        <label htmlFor="email">Agent email</label>
        <input id="email" name="email" type="email" required />
      </div>
      {state?.error && <p className="mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Inviting…" : "Add to Roster"}
      </button>
    </form>
  );
}
