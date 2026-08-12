"use client";

import { useMemo, useState } from "react";
import type { Lang } from "@/lib/contentKit/topics";
import { buildMilestoneTopic, type MilestoneKind, type MilestoneData } from "@/lib/contentKit/milestoneTopics";
import { CarouselKit } from "./CarouselKit";

const HEADLINE: Record<Lang, string> = {
  en: "🎉 You just hit a milestone — share it!",
  zh: "🎉 你达成了一个里程碑——分享一下吧！",
  bm: "🎉 Anda baru sahaja mencapai satu pencapaian — kongsikan!",
};

export function MilestoneShareCard({
  code,
  lang = "en",
  kind,
  data,
}: {
  code: string;
  lang?: Lang;
  kind: MilestoneKind;
  data: MilestoneData;
}) {
  const [dismissed, setDismissed] = useState(false);
  const topic = useMemo(() => buildMilestoneTopic(kind, data), [kind, data]);

  if (dismissed) return null;

  return (
    <div className="card !mb-0 border-[var(--gold)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="row-title !mb-0">{HEADLINE[lang]}</p>
        <button type="button" onClick={() => setDismissed(true)} className="p-note !mb-0 underline">
          Dismiss
        </button>
      </div>
      <CarouselKit code={code} topic={topic} lang={lang} />
    </div>
  );
}
