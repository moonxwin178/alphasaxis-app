import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

const HOME_BY_ROLE: Record<string, string> = {
  USER: "/cases",
  AGENT: "/agent/pipeline",
  AGENCY: "/agency/agents",
  ADMIN: "/admin/users",
};

export default async function RootPage() {
  const user = await verifySession();
  redirect(user ? (HOME_BY_ROLE[user.role] ?? "/cases") : "/login");
}
