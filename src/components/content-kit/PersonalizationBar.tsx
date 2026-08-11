"use client";

import { useState } from "react";
import type { Lang } from "@/lib/contentKit/topics";
import { UI_STRINGS } from "@/lib/contentKit/uiStrings";

export function PersonalizationBar({
  code,
  onCodeChange,
  lang,
}: {
  code: string;
  onCodeChange: (code: string) => void;
  lang: Lang;
}) {
  const t = UI_STRINGS[lang];
  const [draft, setDraft] = useState(code);
  const [copied, setCopied] = useState(false);

  const link = `https://alphasaxis.com/?ref=${draft || code}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function apply() {
    const clean = draft.trim().toUpperCase();
    if (clean) onCodeChange(clean);
  }

  return (
    <div className="card !mb-0">
      <p className="row-title">{t.yourReferralLink}</p>
      <p className="p-note !mb-2.5">{t.referralLinkNote}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={apply}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="min-w-0 flex-1 rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2.5 text-[13px] font-bold text-white outline-none"
        />
        <button type="button" onClick={copy} className="btn secondary !mb-0 !w-auto px-4">
          {copied ? t.copied : t.copyLink}
        </button>
      </div>
      <p className="p-note mt-2 !mb-0 break-all">{link}</p>
    </div>
  );
}
