"use client";

import { useActionState, useRef } from "react";
import { uploadKycDocument } from "@/app/actions/kyc";

const STATUS_BADGE: Record<string, string> = {
  none: '<span class="badge amber">Pending</span>',
  PENDING: '<span class="badge amber">In review</span>',
  VERIFIED: '<span class="badge green">Verified</span>',
  REJECTED: '<span class="badge red">Rejected</span>',
};

export function KycDocRow({
  docType,
  label,
  sub,
  status,
}: {
  docType: "NRIC_PASSPORT" | "SELFIE" | "PROOF_OF_ADDRESS";
  label: string;
  sub: string;
  status: "none" | "PENDING" | "VERIFIED" | "REJECTED";
}) {
  const [state, action, pending] = useActionState(uploadKycDocument, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="mb-1">
      <input type="hidden" name="docType" value={docType} />
      <div className="row">
        <div className="row-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
            <path d="M7 3h7l5 5v13H7z" />
            <path d="M14 3v5h5" />
          </svg>
        </div>
        <label className="min-w-0 flex-1 cursor-pointer">
          <p className="row-title">{label}</p>
          <p className="row-sub">{pending ? "Uploading…" : sub}</p>
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            disabled={pending}
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
        <div className="row-right" dangerouslySetInnerHTML={{ __html: STATUS_BADGE[status] }} />
      </div>
      {state?.error && <p className="mt-1 mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
    </form>
  );
}
