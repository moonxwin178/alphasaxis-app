"use client";

import { useState, useTransition } from "react";
import { inviteLoanConsultant } from "@/app/actions/admin";

export function InviteConsultantForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  return (
    <div className="card !mb-0">
      <p className="row-title mb-2">Invite a Loan Consultant</p>
      {sent ? (
        <p className="p-note text-[var(--green)]">Invite sent — they will set their own password via email.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
          />
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2 text-[12px] font-semibold text-white"
          />
          {error && <p className="p-note text-[var(--red)]">{error}</p>}
          <button
            className="btn secondary"
            style={{ padding: "8px 14px", fontSize: "11.5px" }}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await inviteLoanConsultant(name, email);
                if (result?.error) setError(result.error);
                else setSent(true);
              })
            }
          >
            Send invite
          </button>
        </div>
      )}
    </div>
  );
}
