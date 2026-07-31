"use client";

import { useState, useTransition } from "react";
import { requestService } from "@/app/actions/services";

const METHODS = [
  { key: "AXIS_POINTS", label: "$AXIS Points" },
  { key: "RM", label: "RM" },
  { key: "USDT", label: "USDT" },
] as const;

export function ServiceRequestForm({
  slug,
  pointsCost,
  pointsBalance,
  fulfillment,
}: {
  slug: string;
  pointsCost: number;
  pointsBalance: number;
  fulfillment: string;
}) {
  const [method, setMethod] = useState<(typeof METHODS)[number]["key"]>("AXIS_POINTS");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="card !mb-0 border-[var(--gold-light)] text-center">
        <p className="row-title">Request received</p>
        <p className="p-note !mb-0 mt-1.5">{fulfillment}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Pay with</p>
      <div className="seg">
        {METHODS.map((m) => (
          <button key={m.key} className={method === m.key ? "active" : ""} onClick={() => setMethod(m.key)} type="button">
            {m.label}
          </button>
        ))}
      </div>

      {method === "AXIS_POINTS" ? (
        <p className="p-note">
          {pointsCost.toLocaleString()} pts — your balance: {pointsBalance.toLocaleString()} pts
        </p>
      ) : (
        <p className="p-note">
          Payment in {method === "RM" ? "Ringgit" : "USDT"}{" "}
          isn&apos;t automated yet — submit your request and our team will follow up directly to
          collect payment.
        </p>
      )}

      {error && <p className="p-note text-[var(--red)]">{error}</p>}

      <button
        className="btn primary"
        disabled={pending || (method === "AXIS_POINTS" && pointsBalance < pointsCost)}
        onClick={() =>
          startTransition(async () => {
            const res = await requestService(slug, method);
            if (res?.error) {
              setError(res.error);
              return;
            }
            setError(null);
            setDone(true);
          })
        }
      >
        {pending ? "Submitting…" : "Request This Service"}
      </button>
    </div>
  );
}
