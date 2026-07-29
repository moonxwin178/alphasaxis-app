import { requireUser } from "@/lib/dal";
import { AppShell } from "@/components/AppShell";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <AppShell>
      <div className="flex-1 pb-10">{children}</div>
    </AppShell>
  );
}
