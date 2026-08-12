"use client";

import { useState, useTransition } from "react";
import { claimReferralMilestoneAction } from "@/app/actions/earn";
import { MilestoneShareCard } from "@/components/content-kit/MilestoneShareCard";

export function MilestoneRow({
  milestoneKey,
  label,
  progress,
  threshold,
  rewardAxis,
  eligible,
  claimed,
  code,
}: {
  milestoneKey: string;
  label: string;
  progress: number;
  threshold: number;
  rewardAxis: number;
  eligible: boolean;
  claimed: boolean;
  code: string;
}) {
  const [pending, startTransition] = useTransition();
  const [justClaimed, setJustClaimed] = useState(false);

  function claim() {
    startTransition(async () => {
      const res = await claimReferralMilestoneAction(milestoneKey);
      if (res?.ok) setJustClaimed(true);
    });
  }

  return (
    <>
      <div className="row">
        <div className="row-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
            <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="row-title">{label}</p>
          <p className="row-sub">
            {Math.min(progress, threshold)}/{threshold} · +{rewardAxis.toLocaleString()} $AXIS
          </p>
        </div>
        {claimed || justClaimed ? (
          <span className="badge green">Claimed</span>
        ) : !eligible ? (
          <span className="badge amber">Locked</span>
        ) : (
          <button className="row-right cursor-pointer bg-transparent" disabled={pending} onClick={claim}>
            {pending ? "Claiming…" : "Claim"}
          </button>
        )}
      </div>
      {justClaimed && (
        <div className="mt-2">
          <MilestoneShareCard code={code} kind="referral-milestone" data={{ count: threshold }} />
        </div>
      )}
    </>
  );
}
