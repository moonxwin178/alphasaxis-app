"use client";

import { useState, useTransition } from "react";
import { setKycIdentityNumber } from "@/app/actions/kyc";

export function IdentityNumberField({ initialValue }: { initialValue: string | null }) {
  const [value, setValue] = useState(initialValue ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  return (
    <div className="field">
      <label htmlFor="identityNumber">NRIC / passport number</label>
      <input
        id="identityNumber"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (!value.trim()) return;
          setSaved(false);
          setError(undefined);
          startTransition(async () => {
            const result = await setKycIdentityNumber(value);
            if (result?.error) setError(result.error);
            else setSaved(true);
          });
        }}
        placeholder="e.g. 900101-14-5566"
      />
      {pending && <p className="p-note !mb-0">Saving…</p>}
      {error && !pending && <p className="p-note !mb-0 text-[var(--red)]">{error}</p>}
      {saved && !pending && !error && <p className="p-note !mb-0 text-[var(--green)]">Saved.</p>}
    </div>
  );
}
