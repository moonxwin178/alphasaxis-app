"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { acceptConsultantInvite } from "@/app/actions/auth";

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, action, pending] = useActionState(acceptConsultantInvite, undefined);

  if (!token) {
    return <p className="p-note">This invite link is missing its token.</p>;
  }

  return (
    <form action={action}>
      <h1 className="h2 mb-2">Set your password</h1>
      <p className="p-note mb-5">Activate your Loan Consultant account on AlphasAxis.</p>
      <input type="hidden" name="token" value={token} />
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {state?.error && <p className="mb-3 text-[12px] font-semibold text-red-400">{state.error}</p>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Activating…" : "Activate account"}
      </button>
    </form>
  );
}

export default function ConsultantInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
