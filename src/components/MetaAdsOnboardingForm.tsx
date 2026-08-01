"use client";

import { useActionState, useState } from "react";
import { submitMetaAdsOnboarding } from "@/app/actions/mining";

const CATEGORIES = [
  {
    value: "PROPERTY_LOAN_LEADGEN",
    label: "Property / loan-financing lead-gen",
    hint: "Higher $AXIS reward",
    highlight: true,
  },
  { value: "GENERAL", label: "General ad spend", hint: "Standard reward", highlight: false },
] as const;

type ConnectState = "idle" | "connecting" | "not-available";

export function MetaAdsOnboardingForm() {
  const [state, action, pending] = useActionState(submitMetaAdsOnboarding, undefined);
  const [connect, setConnect] = useState<ConnectState>("idle");
  const [category, setCategory] = useState<string>("");

  return (
    <div className="card">
      <p className="row-title mb-2">Meta Ads spend onboarding</p>

      {connect !== "not-available" ? (
        <button
          type="button"
          className="btn secondary mb-3"
          disabled={connect === "connecting"}
          onClick={() => {
            setConnect("connecting");
            setTimeout(() => setConnect("not-available"), 900);
          }}
        >
          {connect === "connecting" ? "Connecting to Meta…" : "Connect Meta Business Account"}
        </button>
      ) : (
        <p className="p-note mb-3">
          Meta Business auto-verification isn&apos;t live yet — submit your spend manually below in the
          meantime, same reward either way.
        </p>
      )}

      <form action={action}>
        <p className="eyebrow mb-1.5">Ad category</p>
        <div className="mb-3 flex flex-col gap-2">
          {CATEGORIES.map((c) => (
            <label
              key={c.value}
              className="row"
              style={{
                cursor: "pointer",
                borderColor: category === c.value ? "var(--gold)" : undefined,
              }}
            >
              <input
                type="radio"
                name="category"
                value={c.value}
                required
                checked={category === c.value}
                onChange={() => setCategory(c.value)}
                className="mr-1"
              />
              <div className="min-w-0 flex-1">
                <p className="row-title">{c.label}</p>
              </div>
              {c.highlight && <span className="badge gold shrink-0">{c.hint}</span>}
            </label>
          ))}
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
    </div>
  );
}
