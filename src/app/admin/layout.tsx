import { requireRole } from "@/lib/dal";
import { BottomNav } from "@/components/BottomNav";
import { AppShell } from "@/components/AppShell";
import { ADMIN_TABS } from "@/lib/roleNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  return (
    <AppShell>
      <div className="flex-1">{children}</div>
      <BottomNav tabs={ADMIN_TABS} />
    </AppShell>
  );
}
