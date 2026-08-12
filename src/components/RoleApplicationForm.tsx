"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { applyForRole } from "@/app/actions/roleApplication";
import { MEMBERSHIP_PRICE_USDT } from "@/lib/membership";
import { MINT_PRICE_AXIS } from "@/lib/mintPricing";
import { MilestoneShareCard } from "@/components/content-kit/MilestoneShareCard";

export function RoleApplicationForm({
  walletBalance,
  axisBalance,
  code,
}: {
  walletBalance: number;
  axisBalance: number;
  code: string;
}) {
  const [state, action, pending] = useActionState(applyForRole, undefined);
  const [role, setRole] = useState<"AGENT" | "AGENCY">("AGENT");
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "AXIS">("WALLET");

  const usdPrice = MEMBERSHIP_PRICE_USDT[role];
  const axisPrice = MINT_PRICE_AXIS[role];
  const canAfford = paymentMethod === "WALLET" ? walletBalance >= usdPrice : axisBalance >= axisPrice;

  if (state?.agentActivated) {
    return (
      <div className="flex flex-col gap-3">
        <div className="card !mb-0">
          <p className="row-title mb-1">You&apos;re now an Agent 🎉</p>
          <p className="p-note !mb-0">AxisOne is active — refresh to see it reflected across the app.</p>
        </div>
        <MilestoneShareCard code={code} kind="tier-upgrade" data={{ tier: "AXIS_ONE" }} />
      </div>
    );
  }

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

      <p className="eyebrow mt-2 mb-1">Pay with</p>
      <div className="seg">
        <button type="button" className={paymentMethod === "WALLET" ? "active" : ""} onClick={() => setPaymentMethod("WALLET")}>
          Wallet (USD)
        </button>
        <button type="button" className={paymentMethod === "AXIS" ? "active" : ""} onClick={() => setPaymentMethod("AXIS")}>
          $AXIS ({axisPrice.toLocaleString()})
        </button>
      </div>

      <p className="p-note">
        {paymentMethod === "AXIS"
          ? `Mine-cycling: pay with your earned $AXIS instead of cash. 15% pays your referrer (in $AXIS), the rest is burned or reserved for liquidity — nothing re-enters circulation as sell pressure. ${
              role === "AGENT" ? "Activates instantly." : "Activates once an admin approves."
            }`
          : role === "AGENT"
            ? "Deducted from your wallet balance and activates instantly."
            : "Deducted from your wallet balance now; activates once an admin approves (refunded if declined)."}
      </p>
      <p className="p-note">
        {paymentMethod === "AXIS"
          ? `Liquid $AXIS balance: ${axisBalance.toLocaleString()}`
          : `Wallet balance: $${walletBalance.toLocaleString()}`}
      </p>

      <input type="hidden" name="requestedRole" value={role} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
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
      ) : paymentMethod === "WALLET" ? (
        <Link href="/wallet" className="btn secondary">
          Top Up Wallet
        </Link>
      ) : (
        <Link href="/earn/mine" className="btn secondary">
          Mine more $AXIS
        </Link>
      )}
    </form>
  );
}
