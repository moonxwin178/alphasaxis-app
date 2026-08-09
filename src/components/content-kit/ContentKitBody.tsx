"use client";

import { useState } from "react";
import { PersonalizationBar } from "./PersonalizationBar";
import { CarouselKit } from "./CarouselKit";
import { CaptionBank } from "./CaptionBank";

export function ContentKitBody({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);

  return (
    <div className="flex flex-col gap-4">
      <PersonalizationBar code={code} onCodeChange={setCode} />
      <CarouselKit code={code} />
      <CaptionBank code={code} />
    </div>
  );
}
