import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { AdminKycRow } from "@/components/AdminKycRow";
import { AdminRoleAppRow } from "@/components/AdminRoleAppRow";

const STATUS_BADGE: Record<string, string> = {
  VERIFIED: '<span class="badge green">Approved</span>',
  MISMATCH: '<span class="badge red">Rejected</span>',
};

export default async function AdminUsersPage() {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const [submissions, roleApplications] = await Promise.all([
    prisma.kycSubmission.findMany({
      where: { status: { in: ["PENDING", "VERIFIED", "MISMATCH"] } },
      include: { user: { select: { name: true, email: true } }, documents: true },
      orderBy: { submittedAt: "desc" },
      take: 30,
    }),
    prisma.roleApplication.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <AppHeader title="User Approval" />
      <div className="px-4 pt-4">
        {roleApplications.length > 0 && (
          <>
            <p className="eyebrow">Agent / agency applications</p>
            {roleApplications.map((a) => (
              <AdminRoleAppRow
                key={a.id}
                applicationId={a.id}
                name={a.user.name}
                requestedRole={a.requestedRole}
                agencyName={a.agencyName}
              />
            ))}
          </>
        )}

        <p className="eyebrow mt-2">Identity verification</p>
        {submissions.length === 0 && <p className="p-note">No KYC submissions yet.</p>}
        {submissions.map((s) =>
          s.status === "PENDING" ? (
            <AdminKycRow
              key={s.id}
              submissionId={s.id}
              name={s.user.name}
              email={s.user.email}
              documents={s.documents.map((d) => ({ id: d.id, docType: d.docType }))}
            />
          ) : (
            <div key={s.id} className="row">
              <div className="row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                  <circle cx="12" cy="8" r="3.7" />
                  <path d="M4.5 20c1.4-4 5-6 7.5-6s6.1 2 7.5 6" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="row-title">{s.user.name}</p>
                <p className="row-sub">{s.user.email}</p>
              </div>
              <div className="row-right" dangerouslySetInnerHTML={{ __html: STATUS_BADGE[s.status] ?? "" }} />
            </div>
          )
        )}
      </div>
    </div>
  );
}
