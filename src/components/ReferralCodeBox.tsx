"use client";

import { useState } from "react";

export function ReferralCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await navigator.clipboard.writeText(`${origin}/register?ref=${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="card !mb-0">
      <p className="row-title">Your referral code</p>
      <button
        type="button"
        onClick={copy}
        className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2.5 text-[13px] font-bold text-white"
      >
        <span>{code}</span>
        <span className="text-gold-light">{copied ? "Copied!" : "Copy link"}</span>
      </button>
    </div>
  );
}
