"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { applyForRole } from "@/app/actions/roleApplication";
import { MEMBERSHIP_PRICE_USDT } from "@/lib/membership";

export function RoleApplicationForm({ walletBalance }: { walletBalance: number }) {
  const [state, action, pending] = useActionState(applyForRole, undefined);
  const [role, setRole] = useState<"AGENT" | "AGENCY">("AGENT");
  const price = MEMBERSHIP_PRICE_USDT[role];
  const canAfford = walletBalance >= price;

  return (
    <form action={action} className="card">
      <p className="row-title mb-2">Mint your Agent or Agency identity</p>
      <div className="seg">
        <button type="button" className={role === "AGENT" ? "active" : ""} onClick={() => setRole("AGENT")}>
          Agent — ${MEMBERSHIP_PRICE_USDT.AGENT} USD
        </button>
        <button type="button" className={role === "AGENCY" ? "active" : ""} onClick={() => setRole("AGENCY")}>
          Agency — ${MEMBERSHIP_PRICE_USDT.AGENCY.toLocaleString()} USD
        </button>
      </div>
      <p className="p-note">
        {role === "AGENT"
          ? "Deducted from your wallet balance and activates instantly."
          : "Deducted from your wallet balance now; activates once an admin approves (refunded if declined)."}
      </p>
      <p className="p-note">Wallet balance: ${walletBalance.toLocaleString()}</p>
      <input type="hidden" name="requestedRole" value={role} />
      {role === "AGENCY" && (
        <div className="field">
          <label htmlFor="agencyName">Agency name</label>
          <input id="agencyName" name="agencyName" type="text" required />
        </div>
      )}
      {state?.error && <p className="mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
      {canAfford ? (
        <button className="btn secondary" type="submit" disabled={pending}>
          {pending ? "Submitting…" : role === "AGENT" ? "Activate Agent" : "Submit for Approval"}
        </button>
      ) : (
        <Link href="/wallet" className="btn secondary">
          Top Up Wallet
        </Link>
      )}
    </form>
  );
}
