import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";

export default async function AdminAnalyticsPage() {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const [totalUsers, totalCases, financedAgg, verifiedKyc] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.case.count(),
    prisma.case.aggregate({
      where: { status: { in: ["APPROVED", "DISBURSED"] } },
      _sum: { amount: true },
    }),
    prisma.kycSubmission.count({ where: { status: "VERIFIED" } }),
  ]);

  return (
    <div>
      <AppHeader title="Analytics" />
      <div className="px-4 pt-4">
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Total users</div>
            <div className="value">{totalUsers}</div>
          </div>
          <div className="stat">
            <div className="label">Total cases</div>
            <div className="value">{totalCases}</div>
          </div>
          <div className="stat">
            <div className="label">Loan volume</div>
            <div className="value">RM {Number(financedAgg._sum.amount ?? 0).toLocaleString()}</div>
          </div>
          <div className="stat">
            <div className="label">KYC verified</div>
            <div className="value">{verifiedKyc}</div>
          </div>
        </div>
        <p className="p-note">Agent/agency performance breakdowns ship in Phase B.</p>
      </div>
    </div>
  );
}
