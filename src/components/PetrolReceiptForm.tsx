"use client";

import { useActionState } from "react";
import { submitPetrolReceipt } from "@/app/actions/mining";

const MERCHANTS = ["Petron", "Petronas", "Shell"] as const;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PetrolReceiptForm() {
  const [state, action, pending] = useActionState(submitPetrolReceipt, undefined);

  return (
    <form action={action} className="card">
      <p className="row-title mb-2">Petrol subsidy receipt</p>
      <p className="p-note mb-2">
        Only receipts from this calendar month are eligible — the government subsidy portion is calculated
        automatically from your total spend.
      </p>
      <div className="field">
        <label htmlFor="merchantName">Station</label>
        <select id="merchantName" name="merchantName" required defaultValue="">
          <option value="" disabled>
            Select station
          </option>
          {MERCHANTS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="receiptNumber">Receipt / invoice number</label>
        <input id="receiptNumber" name="receiptNumber" type="text" required maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor="spendDate">Date on receipt</label>
        <input id="spendDate" name="spendDate" type="date" required max={todayIso()} defaultValue={todayIso()} />
      </div>
      <div className="field">
        <label htmlFor="spendAmountRm">Total petrol spend (RM)</label>
        <input id="spendAmountRm" name="spendAmountRm" type="number" step="0.01" min="0" required />
      </div>
      <div className="field">
        <label htmlFor="receipt">Receipt photo</label>
        <input id="receipt" name="receipt" type="file" accept="image/jpeg,image/png" required />
      </div>
      {state?.error && <p className="mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
      {state?.ok && <p className="mb-2 text-[11px] font-semibold text-[var(--green)]">Submitted for review.</p>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Submit for Review"}
      </button>
    </form>
  );
}
