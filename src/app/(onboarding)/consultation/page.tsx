"use client";

import { useActionState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { requestConsultation } from "@/app/actions/consultation";

export default function ConsultationPage() {
  const [state, action, pending] = useActionState(requestConsultation, undefined);

  return (
    <div>
      <AppHeader title="Request Loan Consultation" backHref="/cases" />
      <form action={action} className="px-4 pt-4">
        <div className="card">
          <p className="eyebrow">Financing type</p>
          <div className="seg">
            <label className="flex-1">
              <input type="radio" name="financingType" value="MORTGAGE" defaultChecked className="peer sr-only" />
              <span className="block cursor-pointer rounded-lg py-2 text-center peer-checked:bg-[linear-gradient(135deg,var(--gold-light),var(--gold))] peer-checked:text-[#241505]">
                Home loan
              </span>
            </label>
            <label className="flex-1">
              <input type="radio" name="financingType" value="PERSONAL" className="peer sr-only" />
              <span className="block cursor-pointer rounded-lg py-2 text-center peer-checked:bg-[linear-gradient(135deg,var(--gold-light),var(--gold))] peer-checked:text-[#241505]">
                Personal
              </span>
            </label>
            <label className="flex-1">
              <input type="radio" name="financingType" value="BUSINESS" className="peer sr-only" />
              <span className="block cursor-pointer rounded-lg py-2 text-center peer-checked:bg-[linear-gradient(135deg,var(--gold-light),var(--gold))] peer-checked:text-[#241505]">
                Business
              </span>
            </label>
          </div>
          <div className="field">
            <label htmlFor="amount">Financing amount (RM)</label>
            <input id="amount" name="amount" type="text" required placeholder="350,000" />
          </div>
          <div className="field">
            <label htmlFor="employment">Employment status</label>
            <select id="employment" name="employment">
              <option>Salaried</option>
              <option>Self-employed</option>
              <option>Business owner</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="bank">Preferred bank (optional)</label>
            <select id="bank" name="bank">
              <option>No preference</option>
              <option>Maybank</option>
              <option>CIMB</option>
              <option>Public Bank</option>
              <option>RHB</option>
              <option>Hong Leong Bank</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ borderColor: "rgba(158,124,69,.4)" }}>
          <p className="row-title mb-1">No cost during beta</p>
          <p className="row-sub">
            Consultation fees are waived while the AlphasAxis App is in beta. A licensed consultant will
            be assigned to your case within 24 hours.
          </p>
        </div>

        {state?.error && <p className="mb-3 text-[12px] font-semibold text-red-400">{state.error}</p>}

        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit Consultation Request"}
        </button>
      </form>
    </div>
  );
}
