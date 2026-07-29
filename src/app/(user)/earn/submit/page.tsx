import { requireRole } from "@/lib/dal";
import { getSubmitTaskStatus } from "@/app/actions/earn";
import { AppHeader } from "@/components/AppHeader";
import { ClaimTaskButton } from "@/components/ClaimTaskButton";

export default async function EarnSubmitPage() {
  const user = await requireRole("USER");
  const tasks = await getSubmitTaskStatus(user.id);
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
              <p className="row-title">{t.label}</p>
              <p className="row-sub">+{t.points} pts</p>
            </div>
            <ClaimTaskButton taskKey={t.key} eligible={t.eligible} claimed={t.claimed} />
          </div>
        ))}
        <p className="p-note mt-2.5">More task types unlock once you have active cases with an assigned agent.</p>
      </div>
    </div>
  );
}
