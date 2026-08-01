"use client";

import { useTransition } from "react";
import { reviewKyc, reviewKycAdvanced } from "@/app/actions/admin";

export function AdminKycRow({
  submissionId,
  name,
  email,
  documents,
  kind = "standard",
}: {
  submissionId: string;
  name: string;
  email: string;
  documents: { id: string; docType: string }[];
  kind?: "standard" | "advanced";
}) {
  const [pending, startTransition] = useTransition();
  const review = kind === "advanced" ? reviewKycAdvanced : reviewKyc;

  return (
    <>
      <div className="row">
        <div className="row-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
            <circle cx="12" cy="8" r="3.7" />
            <path d="M4.5 20c1.4-4 5-6 7.5-6s6.1 2 7.5 6" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="row-title">
            {name}
            {kind === "advanced" && <span className="badge gold ml-1.5">Advanced</span>}
          </p>
          <p className="row-sub">
            {email} · {documents.length} documents
          </p>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {documents.map((d) => (
          <a
            key={d.id}
            href={`/api/kyc-documents/${d.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pill"
          >
            View {d.docType.replace(/_/g, " ").toLowerCase()}
          </a>
        ))}
      </div>
      <div className="grid2 mt-[-4px] mb-2.5">
        <button
          className="btn ghost"
          style={{ fontSize: "11.5px", padding: 8 }}
          disabled={pending}
          onClick={() => startTransition(() => { void review(submissionId, true); })}
        >
          Approve
        </button>
        <button
          className="btn ghost"
          style={{ fontSize: "11.5px", padding: 8, color: "var(--red)" }}
          disabled={pending}
          onClick={() => startTransition(() => { void review(submissionId, false); })}
        >
          Reject
        </button>
      </div>
    </>
  );
}
