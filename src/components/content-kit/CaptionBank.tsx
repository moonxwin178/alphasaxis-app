"use client";

import { useState } from "react";
import { CAPTION_BANK } from "@/lib/contentKit/captions";

const TOPIC = "axisprestige";

export function CaptionBank({ code }: { code: string }) {
  const categories = CAPTION_BANK[TOPIC];
  const [activeId, setActiveId] = useState(categories[0].id);
  const [shownByCategory, setShownByCategory] = useState<Record<string, number>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, 0]))
  );
  const [usedByCategory, setUsedByCategory] = useState<Record<string, Set<number>>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, new Set<number>([0])]))
  );
  const [copied, setCopied] = useState(false);

  const active = categories.find((c) => c.id === activeId)!;
  const link = `https://alphasaxis.com/?ref=${code}`;
  const captionIndex = shownByCategory[activeId];
  const text = active.captions[captionIndex].text.replace("{LINK}", link);

  function showAnother() {
    const total = active.captions.length;
    const used = usedByCategory[activeId];
    let pool = Array.from({ length: total }, (_, i) => i).filter((i) => !used.has(i));

    // Category exhausted — reshuffle, but never immediately repeat the caption just shown.
    if (pool.length === 0) {
      used.clear();
      pool = Array.from({ length: total }, (_, i) => i).filter((i) => i !== captionIndex);
    }

    const next = pool[Math.floor(Math.random() * pool.length)];
    used.add(next);
    setUsedByCategory({ ...usedByCategory, [activeId]: used });
    setShownByCategory({ ...shownByCategory, [activeId]: next });
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="card !mb-0">
      <p className="row-title mb-2">Caption bank</p>
      <div className="tabstrip">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === activeId ? "active" : ""}
            onClick={() => setActiveId(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="p-note !mb-3">{text}</p>
      <div className="grid2">
        <button type="button" onClick={copy} className="btn secondary !mb-0">
          {copied ? "Copied!" : "Copy caption"}
        </button>
        <button type="button" onClick={showAnother} className="btn secondary !mb-0">
          Show me another
        </button>
      </div>
    </div>
  );
}
