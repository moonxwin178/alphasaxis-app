"use client";

import { useTransition } from "react";
import { claimAgentTask } from "@/app/actions/agentEarn";

export function AgentClaimTaskButton({ taskKey, eligible, claimed }: { taskKey: string; eligible: boolean; claimed: boolean }) {
  const [pending, startTransition] = useTransition();

  if (claimed) return <span className="badge green">Claimed</span>;
  if (!eligible) return <span className="badge amber">Locked</span>;

  return (
    <button
      className="row-right cursor-pointer bg-transparent"
      disabled={pending}
      onClick={() => startTransition(() => { void claimAgentTask(taskKey); })}
    >
      {pending ? "Claiming…" : "Claim"}
    </button>
  );
}
