import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { SpendProofForm } from "@/components/SpendProofForm";

const STATUS_BADGE: Record<string, string> = {
  PENDING: '<span class="badge amber">Review</span>',
  VERIFIED: '<span class="badge green">Approved</span>',
  REJECTED: '<span class="badge red">Rejected</span>',
};

export default async function EarnSpendPage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();
  const submissions = await prisma.receiptUpload.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AppHeader title="Spend to Earn" backHref="/earn" />
      <div className="px-4 pt-4">
        <p className="p-note">
          Upload proof of business spend — approved submissions earn points. Our team reviews each
          submission manually.
        </p>
        <SpendProofForm />

        <p className="eyebrow mt-6">Past submissions</p>
        {submissions.length === 0 && <p className="p-note">No submissions yet.</p>}
        {submissions.map((s) => (
          <div key={s.id} className="row">
            <div className="row-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                <path d="M7 3h7l5 5v13H7z" />
                <path d="M14 3v5h5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="row-title">Receipt uploaded</p>
              <p className="row-sub">{new Date(s.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="row-right" dangerouslySetInnerHTML={{ __html: STATUS_BADGE[s.status] }} />
          </div>
        ))}
      </div>
    </div>
  );
}
