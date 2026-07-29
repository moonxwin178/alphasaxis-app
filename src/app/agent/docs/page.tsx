import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";

export default async function AgentDocsPage() {
  const user = await requireRole("AGENT");
  const prisma = getPrisma();

  const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: user.id } });
  const cases = agentProfile
    ? await prisma.case.findMany({
        where: { agentId: agentProfile.id, status: { in: ["ASSIGNED", "DOCS", "REVIEW"] } },
        include: { applicant: { select: { name: true } }, documents: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <AppHeader title="Document Upload" />
      <div className="px-4 pt-4">
        <p className="p-note">Cases needing document review or upload.</p>
        {cases.length === 0 && <p className="p-note">No active cases right now.</p>}
        {cases.map((c) => (
          <Link key={c.id} href={`/agent/pipeline/${c.id}`} className="row">
            <div className="row-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                <path d="M7 3h7l5 5v13H7z" />
                <path d="M14 3v5h5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="row-title">Case #{c.id.slice(0, 8).toUpperCase()}</p>
              <p className="row-sub">{c.applicant.name}</p>
            </div>
            <div className="row-right">{c.documents.length} docs</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
