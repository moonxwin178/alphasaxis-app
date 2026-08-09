"use client";

import { useState } from "react";
import { PersonalizationBar } from "./PersonalizationBar";
import { PrestigeCarouselKit } from "./PrestigeCarouselKit";

export function ContentKitBody({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);

  return (
    <div className="flex flex-col gap-4">
      <PersonalizationBar code={code} onCodeChange={setCode} />
      <PrestigeCarouselKit code={code} />
    </div>
  );
}
