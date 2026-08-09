import "./contentKit.css";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { ContentKitBody } from "@/components/content-kit/ContentKitBody";

const HOME_BY_ROLE: Record<string, string> = {
  USER: "/cases",
  AGENT: "/agent/pipeline",
  LOAN_CONSULTANT: "/consultant/pipeline",
};

export default async function ContentKitPage() {
  const user = await requireRole("USER", "AGENT", "LOAN_CONSULTANT");
  const prisma = getPrisma();

  const self = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { referralCode: true },
  });

  return (
    <AppShell>
      <AppHeader title="Content Kit" backHref={HOME_BY_ROLE[user.role] ?? "/cases"} />
      <div className="flex-1 px-4 pt-4 pb-8">
        <ContentKitBody initialCode={self.referralCode} />
      </div>
    </AppShell>
  );
}
