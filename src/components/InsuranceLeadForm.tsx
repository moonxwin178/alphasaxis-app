"use client";

import { useActionState } from "react";
import { submitInsuranceLead } from "@/app/actions/earn";

const INSURANCE_TYPES = ["Life", "Medical / Health", "Motor", "Property / Fire", "Personal Accident"] as const;

export function InsuranceLeadForm() {
  const [state, action, pending] = useActionState(submitInsuranceLead, undefined);

  return (
    <form action={action} className="card" id="insurance">
      <p className="row-title mb-1">Submit a potential insurance deal</p>
      <p className="p-note mb-2">
        Know someone who needs coverage? Pass their details to our insurance desk — earns you points once
        submitted.
      </p>
      <div className="field">
        <label htmlFor="contactName">Contact name</label>
        <input id="contactName" name="contactName" type="text" required maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="contactPhone">Contact phone</label>
        <input id="contactPhone" name="contactPhone" type="tel" required maxLength={30} />
      </div>
      <div className="field">
        <label htmlFor="insuranceType">Insurance type</label>
        <select id="insuranceType" name="insuranceType" required defaultValue="">
          <option value="" disabled>
            Select type
          </option>
          {INSURANCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="note">Note (optional)</label>
        <input id="note" name="note" type="text" maxLength={500} placeholder="e.g. Looking for family medical coverage" />
      </div>
      {state?.error && <p className="mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
      {state?.ok && <p className="mb-2 text-[11px] font-semibold text-[var(--green)]">Lead submitted.</p>}
      <button className="btn secondary" type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit Lead"}
      </button>
    </form>
  );
}
