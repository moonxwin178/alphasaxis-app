import Image from "next/image";
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
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center">
        <Image src="/logo.png" alt="AlphasAxis" width={180} height={22} className="h-[22px] w-auto" priority />
      </div>
      {children}
    </div>
  );
}
