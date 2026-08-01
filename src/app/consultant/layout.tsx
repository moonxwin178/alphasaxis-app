import { requireRole } from "@/lib/dal";
import { BottomNav } from "@/components/BottomNav";
import { AppShell } from "@/components/AppShell";
import { CONSULTANT_TABS } from "@/lib/roleNav";

export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  await requireRole("LOAN_CONSULTANT");
  return (
    <AppShell>
      <div className="flex-1 pb-6">{children}</div>
      <BottomNav tabs={CONSULTANT_TABS} />
    </AppShell>
  );
}
