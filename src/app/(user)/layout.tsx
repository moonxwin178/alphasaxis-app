import { requireRole } from "@/lib/dal";
import { BottomNav } from "@/components/BottomNav";
import { AppShell } from "@/components/AppShell";
import { USER_TABS } from "@/lib/roleNav";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  await requireRole("USER");
  return (
    <AppShell>
      <div className="flex-1 pb-6">{children}</div>
      <BottomNav tabs={USER_TABS} />
    </AppShell>
  );
}
