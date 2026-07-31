import { requireRole } from "@/lib/dal";
import { BottomNav } from "@/components/BottomNav";
import { AppShell } from "@/components/AppShell";
import { AGENT_TABS } from "@/lib/roleNav";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("AGENT");
  return (
    <AppShell>
      <div className="flex-1 pb-6">{children}</div>
      <BottomNav tabs={AGENT_TABS} />
    </AppShell>
  );
}
