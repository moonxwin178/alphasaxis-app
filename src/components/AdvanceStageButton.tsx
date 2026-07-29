"use client";

import { useTransition } from "react";
import { advanceCaseStage } from "@/app/actions/agent";

export function AdvanceStageButton({ caseId, label }: { caseId: string; label: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="btn primary"
      disabled={pending}
      onClick={() => startTransition(() => { void advanceCaseStage(caseId); })}
    >
      {pending ? "Updating…" : label}
    </button>
  );
}
