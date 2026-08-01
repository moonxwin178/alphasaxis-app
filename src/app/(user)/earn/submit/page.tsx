import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getInsuranceLeads, getSubmitTaskStatus } from "@/app/actions/earn";
import { AppHeader } from "@/components/AppHeader";
import { ClaimTaskButton } from "@/components/ClaimTaskButton";
import { InsuranceLeadForm } from "@/components/InsuranceLeadForm";

const LEAD_STATUS_BADGE: Record<string, string> = {
  PENDING: '<span class="badge amber">Pending</span>',
  CONTACTED: '<span class="badge amber">Contacted</span>',
  CONVERTED: '<span class="badge green">Converted</span>',
  DECLINED: '<span class="badge red">Declined</span>',
};

export default async function EarnSubmitPage() {
  const user = await requireRole("USER");
  const [tasks, leads] = await Promise.all([getSubmitTaskStatus(user.id), getInsuranceLeads(user.id)]);
  const completedCount = tasks.filter((t) => t.claimed).length;

  return (
    <div>
      <AppHeader title="Submit to Earn Tasks" backHref="/earn" />
      <div className="px-4 pt-4">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(completedCount / tasks.length) * 100}%` }} />
        </div>
        <p className="p-note mt-1">
          {completedCount} of {tasks.length} tasks complete
        </p>

        {tasks.map((t) => (
          <div key={t.key} className="row">
            <div className="row-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                <path d="M7 3h7l5 5v13H7z" />
                <path d="M14 3v5h5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              {t.claimed ? (
                <p className="row-title">{t.label}</p>
              ) : (
                <Link href={t.href} className="row-title" style={{ textDecoration: "underline" }}>
                  {t.label}
                </Link>
              )}
              <p className="row-sub">+{t.points} pts</p>
            </div>
            <ClaimTaskButton taskKey={t.key} eligible={t.eligible} claimed={t.claimed} />
          </div>
        ))}
        <p className="p-note mt-2.5">Tasks unlock automatically once the real action behind them is done — tap a task to go do it.</p>

        <div className="mt-4">
          <InsuranceLeadForm />
        </div>

        {leads.length > 0 && (
          <div className="mt-4">
            <p className="eyebrow">Your insurance leads</p>
            {leads.map((l) => (
              <div key={l.id} className="row">
                <div className="min-w-0 flex-1">
                  <p className="row-title">{l.contactName}</p>
                  <p className="row-sub">{l.insuranceType} · {new Date(l.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="row-right" dangerouslySetInnerHTML={{ __html: LEAD_STATUS_BADGE[l.status] }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
