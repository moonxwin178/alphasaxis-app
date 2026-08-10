"use client";

import { useState } from "react";
import { TOPICS } from "@/lib/contentKit/topics";
import { PersonalizationBar } from "./PersonalizationBar";
import { CarouselKit } from "./CarouselKit";
import { CaptionBank } from "./CaptionBank";

export function ContentKitBody({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [topicSlug, setTopicSlug] = useState(TOPICS[0].slug);
  const topic = TOPICS.find((t) => t.slug === topicSlug) ?? TOPICS[0];

  return (
    <div className="flex flex-col gap-4">
      <PersonalizationBar code={code} onCodeChange={setCode} />

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

      <CarouselKit code={code} topic={topic} />
      <CaptionBank code={code} topicSlug={topicSlug} />
    </div>
  );
}
