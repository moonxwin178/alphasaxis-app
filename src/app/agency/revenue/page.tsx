import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";

export default async function AgencyRevenuePage() {
  const owner = await requireRole("AGENCY");
  const prisma = getPrisma();

  const agency = await prisma.agency.findUnique({
    where: { ownerId: owner.id },
    include: { agencyAgent: { where: { status: "ACTIVE" }, select: { userId: true } } },
  });
  if (!agency) {
    return (
      <div>
        <AppHeader title="Revenue Overview" />
        <div className="px-4 pt-4">
          <p className="p-note">Agency not found.</p>
        </div>
      </div>
    );
  }

  // Revenue across the whole roster: the owner's own commission lines
  // (including OVERRIDE_UPLINE — the 3% they earn from their team's deals)
  // plus every active team member's own lines.
  const rosterIds = [owner.id, ...agency.agencyAgent.map((a) => a.userId)];
  const lines = await prisma.commissionLineItem.findMany({ where: { recipientId: { in: rosterIds } } });

  const total = lines.reduce((sum, c) => sum + Number(c.amount), 0);
  const pending = lines.filter((c) => c.status === "PENDING").reduce((s, c) => s + Number(c.amount), 0);
  const approved = lines.filter((c) => c.status === "APPROVED").reduce((s, c) => s + Number(c.amount), 0);
  const paid = lines.filter((c) => c.status === "PAID").reduce((s, c) => s + Number(c.amount), 0);

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div>
      <AppHeader title="Revenue Overview" />
      <div className="px-4 pt-4">
        <div className="card p-5 text-center">
          <p className="eyebrow">Total commission volume</p>
          <p className="text-[26px] font-extrabold text-white">RM {total.toLocaleString()}</p>
        </div>

        <div className="minibar">
          <span className="lbl">Pending</span>
          <div className="track">
            <div className="fill" style={{ width: `${pct(pending)}%` }} />
          </div>
          <span className="pct">{pct(pending)}%</span>
        </div>
        <div className="minibar">
          <span className="lbl">Approved</span>
          <div className="track">
            <div className="fill" style={{ width: `${pct(approved)}%` }} />
          </div>
          <span className="pct">{pct(approved)}%</span>
        </div>
        <div className="minibar">
          <span className="lbl">Paid</span>
          <div className="track">
            <div className="fill" style={{ width: `${pct(paid)}%` }} />
          </div>
          <span className="pct">{pct(paid)}%</span>
        </div>

        <p className="p-note mt-2.5">
          {lines.length} commission {lines.length === 1 ? "line" : "lines"} across your roster.
        </p>
      </div>
    </div>
  );
}
