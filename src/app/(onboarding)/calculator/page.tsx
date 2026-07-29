"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

type CalcType = "mortgage" | "hp" | "personal";

function computeLoan(calcType: CalcType, principal: number, ratePct: number, years: number) {
  let monthly = 0;
  let total = 0;
  let interest = 0;

  if (calcType === "hp") {
    interest = principal * (ratePct / 100) * years;
    total = principal + interest;
    monthly = total / (years * 12);
  } else {
    const r = ratePct / 100 / 12;
    const n = years * 12;
    monthly = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    total = monthly * n;
    interest = total - principal;
  }

  return { monthly, total, interest };
}

const fmt = (n: number) => `RM ${Math.round(n).toLocaleString()}`;

export default function CalculatorPage() {
  const [calcType, setCalcType] = useState<CalcType>("mortgage");
  const [amount, setAmount] = useState(350000);
  const [rate, setRate] = useState(4.2);
  const [years, setYears] = useState(30);

  const { monthly, total, interest } = useMemo(
    () => computeLoan(calcType, amount, rate, years),
    [calcType, amount, rate, years]
  );

  return (
    <div>
      <AppHeader title="Loan Calculator" backHref="/cases" />
      <div className="px-4 pt-4">
        <p className="p-note">
          Free to use. Get an instant estimate, then let a consultant confirm your best rate.
        </p>
        <div className="seg">
          <button className={calcType === "mortgage" ? "active" : ""} onClick={() => setCalcType("mortgage")}>
            Mortgage
          </button>
          <button className={calcType === "hp" ? "active" : ""} onClick={() => setCalcType("hp")}>
            Hire purchase
          </button>
          <button className={calcType === "personal" ? "active" : ""} onClick={() => setCalcType("personal")}>
            Personal
          </button>
        </div>
        <div className="field">
          <label htmlFor="amount">Loan amount (RM)</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
          />
        </div>
        <div className="field">
          <label htmlFor="rate">Interest rate (% per year)</label>
          <input id="rate" type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} />
        </div>
        <div className="field">
          <label htmlFor="years">Tenure (years)</label>
          <input id="years" type="number" value={years} onChange={(e) => setYears(Number(e.target.value) || 1)} />
        </div>

        <div className="calc-output">
          <div className="eyebrow">Estimated monthly instalment</div>
          <div className="amt gold-text">{fmt(monthly)}</div>
          <div className="grid2 mt-3.5 text-left">
            <div>
              <div className="row-sub">Total interest</div>
              <div className="row-title">{fmt(interest)}</div>
            </div>
            <div>
              <div className="row-sub">Total repayment</div>
              <div className="row-title">{fmt(total)}</div>
            </div>
          </div>
        </div>

        <p className="p-note">Rates shown are indicative. Your assigned consultant will confirm bank-specific offers.</p>
        <Link href="/consultation" className="btn primary">
          Get Matched With a Consultant
        </Link>
      </div>
    </div>
  );
}
