import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { PetrolReceiptForm } from "@/components/PetrolReceiptForm";
import { MetaAdsOnboardingForm } from "@/components/MetaAdsOnboardingForm";
import { getAxisVestingBalance } from "@/lib/axisEmission";
import { getMiningPoolBalance } from "@/lib/miningPool";
import { getMiningPowerMultiplier } from "@/lib/miningPowerMultiplier";

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

  const [minedBalance, poolBalance, mpm, submissions] = await Promise.all([
    getAxisVestingBalance(user.id, "AGENT2MINE_TASK"),
    getMiningPoolBalance(user.id),
    getMiningPowerMultiplier(user.id),
    prisma.axisMiningSubmission.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <AppHeader title="Agent2Mine" backHref="/earn" />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <div className="stat-grid !mb-0">
          <div className="stat">
            <div className="label">$AXIS mined</div>
            <div className="value">{minedBalance.toLocaleString()}</div>
          </div>
          <div className="stat">
            <div className="label">Waiting to be mined</div>
            <div className="value">{poolBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
        <div className="card !mb-0">
          <p className="p-note !mb-0">
            Petrol receipts and ad spend deposit real value into your pool above — a permanent claim, no expiry.
            Complete tasks (check-ins, submit-to-earn, social) to mine it out, up to your tier&apos;s weekly/monthly/
            yearly cap. Your Mining Power Multiplier from active referrals: <b>{mpm.toFixed(2)}x</b>.
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
                  {s.depositValueRm ? ` · RM${Number(s.depositValueRm).toLocaleString()} deposit value` : ""}
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
