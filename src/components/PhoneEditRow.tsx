"use client";

import { useState, useTransition } from "react";
import { updatePhone } from "@/app/actions/profile";

export function PhoneEditRow({ phone }: { phone: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phone ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="row" onClick={() => setEditing(true)}>
        <div className="row-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
            <rect x="6" y="2" width="12" height="20" rx="2" />
            <path d="M11 18h2" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="row-title">Phone number</p>
          {!phone && <p className="row-sub">Add one — unlocks a Submit to Earn task</p>}
        </div>
        <div className="row-right">{phone ?? "Add"}</div>
      </div>
    );
  }

  return (
    <div className="row" style={{ display: "block" }}>
      <div className="field !mb-2">
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          type="tel"
          placeholder="+60 12-345 6789"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      {error && <p className="p-note text-[var(--red)]">{error}</p>}
      <div className="grid2">
        <button
          className="btn ghost !mb-0"
          style={{ fontSize: "12.5px", padding: 10 }}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const formData = new FormData();
              formData.set("phone", value);
              const res = await updatePhone(formData);
              if (res?.error) {
                setError(res.error);
                return;
              }
              setError(null);
              setEditing(false);
            })
          }
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          className="btn ghost !mb-0"
          style={{ fontSize: "12.5px", padding: 10 }}
          disabled={pending}
          onClick={() => {
            setValue(phone ?? "");
            setError(null);
            setEditing(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
