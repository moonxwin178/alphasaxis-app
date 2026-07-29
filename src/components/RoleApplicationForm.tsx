"use client";

import { useActionState, useState } from "react";
import { applyForRole } from "@/app/actions/roleApplication";

export function RoleApplicationForm() {
  const [state, action, pending] = useActionState(applyForRole, undefined);
  const [role, setRole] = useState<"AGENT" | "AGENCY">("AGENT");

  return (
    <form action={action} className="card">
      <p className="row-title mb-2">Apply to become an Agent or Agency</p>
      <div className="seg">
        <button type="button" className={role === "AGENT" ? "active" : ""} onClick={() => setRole("AGENT")}>
          Agent
        </button>
        <button type="button" className={role === "AGENCY" ? "active" : ""} onClick={() => setRole("AGENCY")}>
          Agency
        </button>
      </div>
      <input type="hidden" name="requestedRole" value={role} />
      {role === "AGENCY" && (
        <div className="field">
          <label htmlFor="agencyName">Agency name</label>
          <input id="agencyName" name="agencyName" type="text" required />
        </div>
      )}
      {state?.error && <p className="mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
      <button className="btn secondary" type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}
