"use client";

import { useState, useTransition } from "react";
import { setKycNationality } from "@/app/actions/kyc";

const COUNTRIES = [
  "Malaysia",
  "Singapore",
  "Indonesia",
  "Thailand",
  "Vietnam",
  "Philippines",
  "Brunei",
  "Cambodia",
  "Laos",
  "Myanmar",
  "Other",
] as const;

export function NationalitySelect({ initialValue }: { initialValue: string | null }) {
  const [value, setValue] = useState(initialValue ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="field">
      <label htmlFor="nationality">Nationality</label>
      <select
        id="nationality"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          setSaved(false);
          startTransition(async () => {
            await setKycNationality(next);
            setSaved(true);
          });
        }}
      >
        <option value="" disabled>
          Select nationality
        </option>
        {COUNTRIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {pending && <p className="p-note !mb-0">Saving…</p>}
      {saved && !pending && <p className="p-note !mb-0 text-[var(--green)]">Saved.</p>}
    </div>
  );
}
