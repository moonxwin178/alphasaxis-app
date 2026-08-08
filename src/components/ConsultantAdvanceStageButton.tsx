"use client";

import { useTransition } from "react";
import { advanceConsultantCaseStage } from "@/app/actions/consultant";

export function ConsultantAdvanceStageButton({ caseId, label }: { caseId: string; label: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="btn primary"
      disabled={pending}
      onClick={() => startTransition(() => { void advanceConsultantCaseStage(caseId); })}
    >
      {pending ? "Updating…" : label}
    </button>
  );
}
