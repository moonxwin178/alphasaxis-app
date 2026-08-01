"use client";

import { useActionState } from "react";
import { submitMetaAdsOnboarding } from "@/app/actions/mining";

export function MetaAdsOnboardingForm() {
  const [state, action, pending] = useActionState(submitMetaAdsOnboarding, undefined);

  return (
    <form action={action} className="card">
      <p className="row-title mb-2">Meta Ads spend onboarding</p>
      <div className="field">
        <label htmlFor="category">Ad category</label>
        <select id="category" name="category" required defaultValue="">
          <option value="" disabled>
            Select category
          </option>
          <option value="PROPERTY_LOAN_LEADGEN">Property / loan-financing lead-gen</option>
          <option value="GENERAL">General ad spend</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="spendUsd">Ad spend (USD)</label>
        <input id="spendUsd" name="spendUsd" type="number" step="0.01" min="0" required />
      </div>
      <div className="field">
        <label htmlFor="proof">Screenshot of Meta Ads Manager spend</label>
        <input id="proof" name="proof" type="file" accept="image/jpeg,image/png" required />
      </div>
      {state?.error && <p className="mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
      {state?.ok && <p className="mb-2 text-[11px] font-semibold text-[var(--green)]">Submitted for review.</p>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Submit for Review"}
      </button>
    </form>
  );
}
