"use client";

import { useTransition } from "react";
import { claimSocialTask } from "@/app/actions/earn";

export function SocialTaskRow({
  taskKey,
  label,
  points,
  href,
  claimed,
}: {
  taskKey: string;
  label: string;
  points: number;
  href: string;
  claimed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="row">
      <div className="row-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
          <circle cx="9" cy="8" r="3.3" />
          <circle cx="17" cy="9" r="2.6" />
          <path d="M2.5 20c1.2-3.6 4-5.5 6.5-5.5s5.3 1.9 6.5 5.5M15 14.7c2 .2 4 1.7 4.8 4" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <a href={href} target="_blank" rel="noopener noreferrer" className="row-title" style={{ textDecoration: "underline" }}>
          {label}
        </a>
        <p className="row-sub">+{points} pts</p>
      </div>
      {claimed ? (
        <span className="badge green">Claimed</span>
      ) : (
        <button
          className="row-right cursor-pointer bg-transparent"
          disabled={pending}
          onClick={() => startTransition(() => { void claimSocialTask(taskKey); })}
        >
          {pending ? "…" : "Claim"}
        </button>
      )}
    </div>
  );
}
