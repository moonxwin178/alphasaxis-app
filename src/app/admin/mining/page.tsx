import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { AdminMiningRow } from "@/components/AdminMiningRow";
import { AiVerificationPreview } from "@/components/AiVerificationPreview";
import { getEmissionSnapshot, type MiningTier } from "@/lib/axisEmission";
import { resolveBrokerageTier } from "@/lib/commissionResolve";

const TASK_LABEL: Record<string, string> = {
  PETROL_RECEIPT: "Petrol subsidy receipt",
  META_ADS_ONBOARDING: "Meta Ads onboarding",
};

export default async function AdminMiningPage() {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const [submissions, snapshot] = await Promise.all([
    prisma.axisMiningSubmission.findMany({
      where: { status: { in: ["PENDING", "FLAGGED_DUPLICATE"] } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 30,
    }),
    getEmissionSnapshot(),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const rows = await Promise.all(
    submissions.map(async (s) => {
      const tier = (await resolveBrokerageTier(s.userId)) as MiningTier;
      let suggestedAmount = 0;
      if (snapshot) {
        const awardedAgg = await prisma.axisVestingLedgerEntry.aggregate({
          where: { userId: s.userId, source: "AGENT2MINE_TASK", createdAt: { gte: monthStart } },
          _sum: { delta: true },
        });
        const already = Number(awardedAgg._sum.delta ?? 0);
        suggestedAmount = Math.max(0, snapshot.capByTier[tier] - already);
      }
      return { submission: s, tier, suggestedAmount };
    })
  );

  return (
    <div>
      <AppHeader title="Agent2Mine Review" backHref="/admin/users" />
      <div className="px-4 pt-4">
        {snapshot && (
          <div className="card">
            <p className="row-title mb-1">Emission pool this month</p>
            <p className="row-sub">
              RM budget: {snapshot.monthlyEmissionBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
              $AXIS · {snapshot.monthsLeft} months remaining · caps — Zero{" "}
              {snapshot.capByTier.AXIS_ZERO.toFixed(2)}, One {snapshot.capByTier.AXIS_ONE.toFixed(2)}, Pro{" "}
              {snapshot.capByTier.AXIS_PRO.toFixed(2)}
            </p>
          </div>
        )}

        {rows.length === 0 && <p className="p-note">No pending submissions.</p>}
        {rows.map(({ submission: s, tier, suggestedAmount }) => (
          <div key={s.id}>
            {s.taskType === "PETROL_RECEIPT" && (
              <AiVerificationPreview
                merchantName={s.merchantName}
                receiptNumber={s.receiptNumber}
                subsidyAmountRm={s.subsidyAmountRm ? Number(s.subsidyAmountRm) : null}
              />
            )}
            <AdminMiningRow
              submissionId={s.id}
              title={`${TASK_LABEL[s.taskType]} — ${s.user.name}`}
              sub={
                s.status === "FLAGGED_DUPLICATE"
                  ? `Flagged: ${s.rejectionReason ?? "possible duplicate"} · Tier ${tier}`
                  : `${
                      s.taskType === "PETROL_RECEIPT"
                        ? `${s.merchantName} — RM ${Number(s.subsidyAmountRm ?? 0).toLocaleString()}`
                        : `${s.metaAdsCategory} — $${Number(s.metaAdsSpendUsd ?? 0).toLocaleString()}`
                    } · Tier ${tier}`
              }
              suggestedAmount={suggestedAmount}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
