import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { CaseTracker } from "@/components/CaseTracker";
import { RaiseDisputeForm } from "@/components/RaiseDisputeForm";

const FINANCING_LABEL: Record<string, string> = {
  MORTGAGE: "Home loan",
  HIRE_PURCHASE: "Hire purchase",
  PERSONAL: "Personal financing",
  BUSINESS: "Business financing",
};

const DOC_STATUS_BADGE: Record<string, string> = {
  PENDING: '<span class="badge amber">In review</span>',
  VERIFIED: '<span class="badge green">Verified</span>',
  REJECTED: '<span class="badge red">Rejected</span>',
};

export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const user = await requireRole("USER");
  const { caseId } = await params;
  const prisma = getPrisma();

  const theCase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      documents: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      agent: { include: { user: { select: { name: true } } } },
    },
  });

  if (!theCase || theCase.applicantId !== user.id) notFound();

  return (
    <div>
      <AppHeader title="Case Detail" backHref="/cases" />
      <div className="px-4 pt-4">
        <div className="card">
          <p className="eyebrow">Case #{theCase.id.slice(0, 8).toUpperCase()}</p>
          <p className="row-title mb-2 text-[15px]">
            {FINANCING_LABEL[theCase.financingType]} — RM {Number(theCase.amount).toLocaleString()}
          </p>
          <CaseTracker status={theCase.status} />
        </div>

        <div className="card flex items-center gap-3">
          <div className="row-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
              <circle cx="12" cy="8" r="3.7" />
              <path d="M4.5 20c1.4-4 5-6 7.5-6s6.1 2 7.5 6" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="row-title">{theCase.agent?.user.name ?? "Not yet assigned"}</p>
            <p className="row-sub">
              {theCase.agent ? "Your assigned consultant" : "An agent will be assigned within 24 hours"}
            </p>
          </div>
        </div>

        <p className="eyebrow">Document checklist</p>
        <div className="card">
          {theCase.documents.length === 0 ? (
            <p className="p-note">No documents uploaded yet.</p>
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
                <div
                  className="row-right"
                  dangerouslySetInnerHTML={{ __html: DOC_STATUS_BADGE[doc.status] }}
                />
              </div>
            ))
          )}
        </div>

        <p className="eyebrow">Timeline</p>
        <div className="card">
          {theCase.events.length === 0 ? (
            <p className="p-note">Case submitted — updates will appear here.</p>
          ) : (
            theCase.events.map((ev) => (
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
            ))
          )}
        </div>

        <RaiseDisputeForm caseId={theCase.id} />
      </div>
    </div>
  );
}
