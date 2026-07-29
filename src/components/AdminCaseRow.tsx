"use client";

import { useTransition } from "react";
import { reviewCase } from "@/app/actions/admin";

export function AdminCaseRow({
  caseId,
  title,
  sub,
  status,
}: {
  caseId: string;
  title: string;
  sub: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  // Approve/flag only makes sense once the case has actually reached review —
  // an unassigned SUBMITTED case should be assigned first (see AssignAgentControl).
  const actionable = status === "REVIEW" || status === "FLAGGED";

  const STATUS_BADGE: Record<string, string> = {
    SUBMITTED: '<span class="badge amber">Unassigned</span>',
    ASSIGNED: '<span class="badge gold">Assigned</span>',
    DOCS: '<span class="badge amber">Docs in progress</span>',
    REVIEW: '<span class="badge amber">Review</span>',
    APPROVED: '<span class="badge green">Approved</span>',
    DISBURSED: '<span class="badge green">Disbursed</span>',
    FLAGGED: '<span class="badge red">Flagged</span>',
  };
  const badge = STATUS_BADGE[status] ?? '<span class="badge amber">Unknown</span>';

  return (
    <>
      <div className="row">
        <div className="row-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
            <path d="M3 7h18v12H3z" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="row-title">{title}</p>
          <p className="row-sub">{sub}</p>
        </div>
        <div className="row-right" dangerouslySetInnerHTML={{ __html: badge }} />
      </div>
      {actionable && (
        <div className="grid2 mt-[-4px] mb-2.5">
          <button
            className="btn ghost"
            style={{ fontSize: "11.5px", padding: 8 }}
            disabled={pending}
            onClick={() => startTransition(() => { void reviewCase(caseId, "approve"); })}
          >
            Approve
          </button>
          <button
            className="btn ghost"
            style={{ fontSize: "11.5px", padding: 8, color: "var(--red)" }}
            disabled={pending}
            onClick={() => startTransition(() => { void reviewCase(caseId, "flag"); })}
          >
            Flag
          </button>
        </div>
      )}
    </>
  );
}
