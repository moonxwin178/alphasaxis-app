"use client";

import { useTransition } from "react";
import { claimDailyCheckIn } from "@/app/actions/earn";

export function CheckInButton({ alreadyCheckedIn }: { alreadyCheckedIn: boolean }) {
  const [pending, startTransition] = useTransition();

  if (alreadyCheckedIn) return <span className="badge green">Claimed</span>;

  return (
    <button
      className="row-right cursor-pointer bg-transparent"
      disabled={pending}
      onClick={() => startTransition(() => { void claimDailyCheckIn(); })}
    >
      {pending ? "…" : "Claim"}
    </button>
  );
}
