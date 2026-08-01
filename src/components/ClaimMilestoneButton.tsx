"use client";

import { useTransition } from "react";
import { claimReferralMilestoneAction } from "@/app/actions/earn";

export function ClaimMilestoneButton({
  milestoneKey,
  eligible,
  claimed,
}: {
  milestoneKey: string;
  eligible: boolean;
  claimed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (claimed) return <span className="badge green">Claimed</span>;
  if (!eligible) return <span className="badge amber">Locked</span>;

  return (
    <button
      className="row-right cursor-pointer bg-transparent"
      disabled={pending}
      onClick={() => startTransition(() => { void claimReferralMilestoneAction(milestoneKey); })}
    >
      {pending ? "Claiming…" : "Claim"}
    </button>
  );
}
