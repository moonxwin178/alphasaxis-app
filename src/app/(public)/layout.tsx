import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

const HOME_BY_ROLE: Record<string, string> = {
  USER: "/cases",
  AGENT: "/agent/pipeline",
  AGENCY: "/agency/agents",
  ADMIN: "/admin/users",
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await verifySession();
  if (user) redirect(HOME_BY_ROLE[user.role] ?? "/cases");

  return (
    <div className="mx-auto min-h-screen max-w-[420px] px-4 py-10">
      <div className="mb-8 text-center">
        <span className="text-[20px] font-[800] gold-text">ALPHASAXIS</span>
      </div>
      {children}
    </div>
  );
}
