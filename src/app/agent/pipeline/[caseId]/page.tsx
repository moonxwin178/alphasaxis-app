import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { CaseTracker } from "@/components/CaseTracker";
import { AdvanceStageButton } from "@/components/AdvanceStageButton";
import { CaseDocUploadForm } from "@/components/CaseDocUploadForm";
import { commissionRatePercent } from "@/lib/commission";

const FINANCING_LABEL: Record<string, string> = {
  MORTGAGE: "Home loan",
  HIRE_PURCHASE: "Hire purchase",
  PERSONAL: "Personal financing",
  BUSINESS: "Business financing",
};

const NEXT_STAGE_LABEL: Record<string, string> = {
  ASSIGNED: "Mark Documents In Progress",
  DOCS: "Submit for Review",
};

export default async function AgentCaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const user = await requireRole("AGENT");
  const { caseId } = await params;
  const prisma = getPrisma();

  const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: user.id } });
  const theCase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      applicant: { select: { name: true, phone: true } },
      documents: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      commissions: true,
    },
  });

  if (!theCase || !agentProfile || theCase.agentId !== agentProfile.id) notFound();

  const commission = theCase.commissions[0];
  const nextLabel = NEXT_STAGE_LABEL[theCase.status];

  return (
    <div>
      <AppHeader title="Case Detail" backHref="/agent/pipeline" />
      <div className="px-4 pt-4">
        <div className="card">
          <p className="eyebrow">Case #{theCase.id.slice(0, 8).toUpperCase()}</p>
          <p className="row-title mb-2 text-[15px]">
            {FINANCING_LABEL[theCase.financingType]} — RM {Number(theCase.amount).toLocaleString()}
          </p>
          <CaseTracker status={theCase.status} />
        </div>

        <div className="card">
          <p className="row-title">{theCase.applicant.name}</p>
          <p className="row-sub">{theCase.applicant.phone ?? "No phone on file"}</p>
        </div>

        {commission && (
          <div className="card" style={{ borderColor: "rgba(158,124,69,.4)" }}>
            <p className="row-title mb-1">Estimated commission</p>
            <p className="row-sub">
              RM {Number(commission.amount).toLocaleString()} ({commissionRatePercent(theCase.financingType)} base
              rate × your NFT tier multiplier)
            </p>
          </div>
        )}

        {nextLabel && <AdvanceStageButton caseId={theCase.id} label={nextLabel} />}

        <p className="eyebrow mt-6">Documents</p>
        <div className="card">
          {theCase.documents.length === 0 ? (
            <p className="p-note">No documents yet.</p>
          ) : (
            theCase.documents.map((doc) => (
              <div key={doc.id} className="row">
                <div className="row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                    <path d="M7 3h7l5 5v13H7z" />
                    <path d="M14 3v5h5" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="row-title">{doc.docType}</p>
                </div>
                <span className="badge amber">{doc.status}</span>
              </div>
            ))
          )}
        </div>
        <CaseDocUploadForm caseId={theCase.id} />

        <p className="eyebrow mt-6">Timeline</p>
        <div className="card">
          {theCase.events.map((ev) => (
            <div key={ev.id} className="row">
              <div className="row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-[17px] w-[17px]">
                  <path d="M4 12l6 6L20 6" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="row-title">{ev.note ?? ev.type}</p>
                <p className="row-sub">{new Date(ev.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
