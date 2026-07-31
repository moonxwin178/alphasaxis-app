"use client";

import { useState, useTransition } from "react";
import { requestTopUp } from "@/app/actions/wallet";

export function TopUpForm() {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"RM" | "USDT">("RM");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) {
    return (
      <button className="btn secondary !mb-0" onClick={() => setOpen(true)}>
        Top Up Wallet
      </button>
    );
  }

  if (done) {
    return (
      <div className="card !mb-0 border-[var(--gold-light)] text-center">
        <p className="row-title">Top-up request submitted</p>
        <p className="p-note !mb-0 mt-1.5">
          No payment gateway is wired up yet — an admin will confirm your transfer/deposit and
          credit your balance manually.
        </p>
      </div>
    );
  }

  return (
    <form
      className="card !mb-0"
      action={(formData: FormData) =>
        startTransition(async () => {
          const res = await requestTopUp(formData);
          if (res?.error) {
            setError(res.error);
            return;
          }
          setError(null);
          setDone(true);
        })
      }
    >
      <p className="row-title mb-2">Request a top-up</p>
      <div className="seg">
        <button type="button" className={method === "RM" ? "active" : ""} onClick={() => setMethod("RM")}>
          RM Bank Transfer
        </button>
        <button type="button" className={method === "USDT" ? "active" : ""} onClick={() => setMethod("USDT")}>
          USDT Deposit
        </button>
      </div>
      <input type="hidden" name="method" value={method} />
      <div className="field">
        <label htmlFor="amountUsd">Amount (USD)</label>
        <input id="amountUsd" name="amountUsd" type="number" min="1" step="0.01" required />
      </div>
      <div className="field">
        <label htmlFor="note">Reference / tx hash (optional)</label>
        <input id="note" name="note" type="text" placeholder="Transfer reference or tx hash" />
      </div>
      {error && <p className="p-note text-[var(--red)]">{error}</p>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit Top-Up Request"}
      </button>
    </form>
  );
}
