"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { acceptAccountClaim } from "@/app/actions/auth";

function ClaimAccountForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, action, pending] = useActionState(acceptAccountClaim, undefined);

  if (!token) {
    return <p className="p-note">This link is missing its token.</p>;
  }

  return (
    <form action={action}>
      <h1 className="h2 mb-2">Set your password</h1>
      <p className="p-note mb-5">
        Activate your AlphasAxis account to track your case and start earning points.
      </p>
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

export default function ClaimAccountPage() {
  return (
    <Suspense fallback={null}>
      <ClaimAccountForm />
    </Suspense>
  );
}
