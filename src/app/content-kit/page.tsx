import "./contentKit.css";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ContentKitBody } from "@/components/content-kit/ContentKitBody";
import { USER_TABS, AGENT_TABS, CONSULTANT_TABS } from "@/lib/roleNav";

const TABS_BY_ROLE = {
  USER: USER_TABS,
  AGENT: AGENT_TABS,
  LOAN_CONSULTANT: CONSULTANT_TABS,
} as const;

export default async function ContentKitPage() {
  const user = await requireRole("USER", "AGENT", "LOAN_CONSULTANT");
  const prisma = getPrisma();

  const self = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { referralCode: true },
  });

  return (
    <AppShell>
      <AppHeader title="Content Kit" />
      <div className="flex-1 px-4 pt-4 pb-8">
        <ContentKitBody initialCode={self.referralCode} />
      </div>
      <BottomNav tabs={TABS_BY_ROLE[user.role as keyof typeof TABS_BY_ROLE] ?? USER_TABS} />
    </AppShell>
  );
}
