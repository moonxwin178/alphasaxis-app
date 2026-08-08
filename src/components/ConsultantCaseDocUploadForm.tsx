"use client";

import { useActionState } from "react";
import { uploadConsultantCaseDocument } from "@/app/actions/consultant";

export function ConsultantCaseDocUploadForm({ caseId }: { caseId: string }) {
  const [state, action, pending] = useActionState(uploadConsultantCaseDocument, undefined);

  return (
    <form action={action} className="card">
      <input type="hidden" name="caseId" value={caseId} />
      <div className="field">
        <label htmlFor="docType">Document name</label>
        <input id="docType" name="docType" type="text" required placeholder="e.g. Bank submission proof" />
      </div>
      <div className="field">
        <label htmlFor="file">File</label>
        <input id="file" name="file" type="file" accept="image/jpeg,image/png,application/pdf" required />
      </div>
      {state?.error && <p className="mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
      <button className="btn secondary" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload Document"}
      </button>
    </form>
  );
}
