"use client";

import { useTransition } from "react";
import { reviewRoleApplication } from "@/app/actions/roleApplication";

export function AdminRoleAppRow({
  applicationId,
  name,
  requestedRole,
  agencyName,
}: {
  applicationId: string;
  name: string;
  requestedRole: string;
  agencyName: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="row">
        <div className="row-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
            <circle cx="9" cy="8" r="3.3" />
            <circle cx="17" cy="9" r="2.6" />
            <path d="M2.5 20c1.2-3.6 4-5.5 6.5-5.5s5.3 1.9 6.5 5.5M15 14.7c2 .2 4 1.7 4.8 4" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="row-title">{name}</p>
          <p className="row-sub">
            Wants to become {requestedRole === "AGENCY" ? `an Agency ("${agencyName}")` : "an Agent"}
          </p>
        </div>
      </div>
      <div className="grid2 mt-[-4px] mb-2.5">
        <button
          className="btn ghost"
          style={{ fontSize: "11.5px", padding: 8 }}
          disabled={pending}
          onClick={() => startTransition(() => { void reviewRoleApplication(applicationId, true); })}
        >
          Approve
        </button>
        <button
          className="btn ghost"
          style={{ fontSize: "11.5px", padding: 8, color: "var(--red)" }}
          disabled={pending}
          onClick={() => startTransition(() => { void reviewRoleApplication(applicationId, false); })}
        >
          Reject
        </button>
      </div>
    </>
  );
}
