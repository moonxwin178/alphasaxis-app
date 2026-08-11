"use client";

import { useState } from "react";
import { TOPICS, type Lang } from "@/lib/contentKit/topics";
import { PersonalizationBar } from "./PersonalizationBar";
import { CarouselKit } from "./CarouselKit";
import { CaptionBank } from "./CaptionBank";

const LANGUAGES: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "zh", label: "中文" },
  { id: "bm", label: "BM" },
];

export function ContentKitBody({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [topicSlug, setTopicSlug] = useState(TOPICS[0].slug);
  const [lang, setLang] = useState<Lang>("en");
  const topic = TOPICS.find((t) => t.slug === topicSlug) ?? TOPICS[0];

  return (
    <div className="flex flex-col gap-4">
      <PersonalizationBar code={code} onCodeChange={setCode} />

      <div>
        <p className="row-title mb-2">Language</p>
        <div className="tabstrip">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              className={l.id === lang ? "active" : ""}
              onClick={() => setLang(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="row-title mb-2">Topic</p>
        <div className="tabstrip">
          {TOPICS.map((t) => (
            <button
              key={t.slug}
              type="button"
              className={t.slug === topicSlug ? "active" : ""}
              onClick={() => setTopicSlug(t.slug)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <CarouselKit code={code} topic={topic} lang={lang} />
      <CaptionBank code={code} topicSlug={topicSlug} lang={lang} />
    </div>
  );
}
