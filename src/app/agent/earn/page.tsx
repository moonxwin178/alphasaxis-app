import { requireRole } from "@/lib/dal";
import { getAgentTaskStatus } from "@/app/actions/agentEarn";
import { AppHeader } from "@/components/AppHeader";
import { AgentClaimTaskButton } from "@/components/AgentClaimTaskButton";

export default async function AgentEarnPage() {
  const user = await requireRole("AGENT");
  const tasks = await getAgentTaskStatus(user.id);

  return (
    <div>
      <AppHeader title="Submit to Earn Tasks" />
      <div className="px-4 pt-4">
        {tasks.length === 0 && <p className="p-note">Agent profile not found.</p>}
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
            <AgentClaimTaskButton taskKey={t.key} eligible={t.eligible} claimed={t.claimed} />
          </div>
        ))}
        <p className="p-note mt-2.5">Even unsuccessful cases earn effort points once submitted with proof.</p>
      </div>
    </div>
  );
}
