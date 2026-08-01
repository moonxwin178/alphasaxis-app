/**
 * Mockup only — no vision API is wired up yet. Shows admins what an
 * automated OCR cross-check will eventually look like (extracted fields
 * compared against what the user typed) so the review flow's shape is
 * settled before we plug in a real vision API. Every value here is a
 * placeholder, never computed.
 */
export function AiVerificationPreview({
  merchantName,
  receiptNumber,
  subsidyAmountRm,
}: {
  merchantName: string | null;
  receiptNumber: string | null;
  subsidyAmountRm: number | null;
}) {
  const rows = [
    { label: "Merchant match", userEntered: merchantName ?? "—" },
    { label: "Receipt number match", userEntered: receiptNumber ?? "—" },
    { label: "Amount match", userEntered: subsidyAmountRm ? `RM ${subsidyAmountRm.toLocaleString()}` : "—" },
  ];

  return (
    <div className="card !mb-2" style={{ borderStyle: "dashed", borderColor: "rgba(255,255,255,.18)" }}>
      <div className="mb-2 flex items-center justify-between">
        <p className="row-title !mb-0">AI Verification</p>
        <span className="badge amber">Preview — not live</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between py-1">
          <span className="p-note !mb-0">{r.label}</span>
          <span className="p-note !mb-0" style={{ color: "var(--text-dim, #8a8a8a)" }}>
            {r.userEntered} vs. —
          </span>
        </div>
      ))}
      <p className="p-note mt-2 !mb-0">
        Once a vision API is connected, this section will auto-extract these fields from the receipt image and
        flag mismatches for you — for now, verify manually against the uploaded photo.
      </p>
    </div>
  );
}
