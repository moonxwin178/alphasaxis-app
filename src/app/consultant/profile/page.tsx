import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ConsultantProfilePage() {
  const user = await requireRole("LOAN_CONSULTANT");
  const prisma = getPrisma();
  const self = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  const initials = self.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <AppHeader title="My Profile" />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <div className="card !mb-0 flex items-center gap-3">
          <div className="tier-ring">
            <div className="inner">{initials}</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">{self.name}</p>
            <p className="row-sub">{self.email}</p>
            <p className="row-sub">Loan Consultant</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
