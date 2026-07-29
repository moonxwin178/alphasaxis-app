const STAGES = ["Submitted", "Assigned", "Docs", "Review", "Approved", "Disbursed"];
const STAGE_INDEX: Record<string, number> = {
  SUBMITTED: 0,
  ASSIGNED: 1,
  DOCS: 2,
  REVIEW: 3,
  APPROVED: 4,
  DISBURSED: 5,
  FLAGGED: 2,
};

export function CaseTracker({ status }: { status: string }) {
  const active = STAGE_INDEX[status] ?? 0;
  return (
    <>
      <div className="tracker">
        {STAGES.map((_, i) => (
          <div key={i} className="contents">
            <div className={`node ${i < active ? "done" : i === active ? "active" : ""}`}>
              {i < active ? "✓" : i + 1}
            </div>
            {i < STAGES.length - 1 && <div className={`line ${i < active ? "done" : ""}`} />}
          </div>
        ))}
      </div>
      <div className="tracker-labels">
        {STAGES.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </>
  );
}
