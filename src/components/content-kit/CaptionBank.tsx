"use client";

import { useEffect, useState } from "react";
import { CAPTION_BANK } from "@/lib/contentKit/captions";
import type { Lang } from "@/lib/contentKit/topics";

export function CaptionBank({ code, topicSlug, lang }: { code: string; topicSlug: string; lang: Lang }) {
  const categories = CAPTION_BANK[lang][topicSlug] ?? [];
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const [shownByCategory, setShownByCategory] = useState<Record<string, number>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, 0]))
  );
  const [usedByCategory, setUsedByCategory] = useState<Record<string, Set<number>>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, new Set<number>([0])]))
  );
  const [copied, setCopied] = useState(false);

  // Topic or language changed — this component's categories/captions are entirely different, reset selection state.
  useEffect(() => {
    setActiveId(categories[0]?.id ?? "");
    setShownByCategory(Object.fromEntries(categories.map((c) => [c.id, 0])));
    setUsedByCategory(Object.fromEntries(categories.map((c) => [c.id, new Set<number>([0])])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicSlug, lang]);

  const active = categories.find((c) => c.id === activeId);
  const link = `https://alphasaxis.com/?ref=${code}`;
  const captionIndex = shownByCategory[activeId] ?? 0;
  const text = active ? active.captions[captionIndex].text.replace("{LINK}", link) : "";

  function showAnother() {
    if (!active) return;
    const total = active.captions.length;
    const used = usedByCategory[activeId] ?? new Set<number>();
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

  if (!active) return null;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

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
      <div className="grid2 mb-2.5">
        <button type="button" onClick={copy} className="btn secondary !mb-0">
          {copied ? "Copied!" : "Copy caption"}
        </button>
        <button type="button" onClick={showAnother} className="btn secondary !mb-0">
          Show me another
        </button>
      </div>
      <div className="grid2">
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn secondary !mb-0">
          WhatsApp
        </a>
        <a href={xHref} target="_blank" rel="noopener noreferrer" className="btn secondary !mb-0">
          X
        </a>
      </div>
      <p className="p-note mt-2 !mb-0">For Instagram or TikTok, use the Share button on a slide above, or copy the caption in here.</p>
    </div>
  );
}
