import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { PetrolReceiptForm } from "@/components/PetrolReceiptForm";
import { MetaAdsOnboardingForm } from "@/components/MetaAdsOnboardingForm";
import { getAxisVestingBalance } from "@/lib/axisEmission";

const STATUS_BADGE: Record<string, string> = {
  PENDING: '<span class="badge amber">Review</span>',
  APPROVED: '<span class="badge green">Approved</span>',
  REJECTED: '<span class="badge red">Rejected</span>',
  FLAGGED_DUPLICATE: '<span class="badge red">Flagged</span>',
};

const TASK_LABEL: Record<string, string> = {
  PETROL_RECEIPT: "Petrol subsidy receipt",
  META_ADS_ONBOARDING: "Meta Ads onboarding",
};

export default async function EarnMinePage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const [balance, submissions] = await Promise.all([
    getAxisVestingBalance(user.id, "AGENT2MINE_TASK"),
    prisma.axisMiningSubmission.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <AppHeader title="Agent2Mine" backHref="/earn" />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <div className="card !mb-0 p-5 text-center">
          <p className="eyebrow">$AXIS earned (Agent2Mine)</p>
          <p className="my-1 text-[28px] font-extrabold text-white">{balance.toLocaleString()}</p>
          <p className="p-note !mb-0">
            Separate from your points balance above — real $AXIS mined from Spend-to-Earn tasks, subject to
            a monthly per-tier cap. Distribution to an on-chain wallet is not live yet.
          </p>
        </div>

        <PetrolReceiptForm />
        <MetaAdsOnboardingForm />

        <div>
          <p className="eyebrow">Your submissions</p>
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
                <p className="row-title">{TASK_LABEL[s.taskType]}</p>
                <p className="row-sub">
                  {new Date(s.createdAt).toLocaleDateString()}
                  {s.axisAwarded ? ` · +${Number(s.axisAwarded).toLocaleString()} $AXIS` : ""}
                </p>
              </div>
              <div className="row-right" dangerouslySetInnerHTML={{ __html: STATUS_BADGE[s.status] }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
