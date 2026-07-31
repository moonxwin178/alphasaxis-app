import { requireRole } from "@/lib/dal";
import { BottomNav } from "@/components/BottomNav";
import { AppShell } from "@/components/AppShell";
import { AGENCY_TABS } from "@/lib/roleNav";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  await requireRole("AGENCY");
  return (
    <AppShell>
      <div className="flex-1 pb-6">{children}</div>
      <BottomNav tabs={AGENCY_TABS} />
    </AppShell>
  );
}
