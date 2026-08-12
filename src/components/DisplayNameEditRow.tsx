"use client";

import { useState, useTransition } from "react";
import { updateDisplayName } from "@/app/actions/profile";

export function DisplayNameEditRow({ displayName, fallback }: { displayName: string | null; fallback: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="row" onClick={() => setEditing(true)}>
        <div className="row-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
            <circle cx="12" cy="8" r="3.7" />
            <path d="M4.5 20c1.4-4 5-6 7.5-6s6.1 2 7.5 6" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="row-title">Public display name</p>
          <p className="row-sub">Shown on the public leaderboard instead of your real name</p>
        </div>
        <div className="row-right">{displayName ?? fallback}</div>
      </div>
    );
  }

  return (
    <div className="row" style={{ display: "block" }}>
      <div className="field !mb-2">
        <label htmlFor="displayName">Public display name</label>
        <input
          id="displayName"
          type="text"
          placeholder={fallback}
          maxLength={40}
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
              formData.set("displayName", value);
              const res = await updateDisplayName(formData);
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
            setValue(displayName ?? "");
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
