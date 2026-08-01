import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { AdminMiningRow } from "@/components/AdminMiningRow";
import { AiVerificationPreview } from "@/components/AiVerificationPreview";
import { resolveMiningTier } from "@/lib/commissionResolve";
import { getMiningConfig } from "@/lib/miningConfig";
import { getEmissionSnapshot, HALVING_MILESTONE_MINERS } from "@/lib/axisEmission";

const TASK_LABEL: Record<string, string> = {
  PETROL_RECEIPT: "Petrol subsidy receipt",
  META_ADS_ONBOARDING: "Meta Ads onboarding",
};

export default async function AdminMiningPage() {
  await requireRole("ADMIN");
  const prisma = getPrisma();

  const [submissions, config, snapshot] = await Promise.all([
    prisma.axisMiningSubmission.findMany({
      where: { status: { in: ["PENDING", "FLAGGED_DUPLICATE"] } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 30,
    }),
    getMiningConfig(),
    getEmissionSnapshot(),
  ]);

  const rows = await Promise.all(
    submissions.map(async (s) => {
      const tier = await resolveMiningTier(s.userId);
      return { submission: s, tier };
    })
  );

  return (
    <div>
      <AppHeader title="Agent2Mine Review" backHref="/admin/users" />
      <div className="px-4 pt-4">
        <div className="card">
          <p className="row-title mb-1">Mining config</p>
          <p className="row-sub">
            Petrol subsidy rate: {(config.petrolSubsidyRate * 100).toFixed(0)}% · FX: RM{config.fxRateRmPerUsd.toFixed(2)}
            /USD — edit in code/DB as government policy or FX changes.
          </p>
        </div>

        {snapshot && (
          <div className="card">
            <p className="row-title mb-1">Emission pool</p>
            <p className="row-sub">
              Halving epoch {snapshot.halvingEpoch} ({HALVING_MILESTONE_MINERS.toLocaleString()} miners/halving) ·
              monthly budget {snapshot.monthlyEmissionBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
              $AXIS · caps — Zero {snapshot.capByTier.AXIS_ZERO.toFixed(2)}, One {snapshot.capByTier.AXIS_ONE.toFixed(2)}
              , Pro {snapshot.capByTier.AXIS_PRO.toFixed(2)}, Prestige {snapshot.capByTier.AXIS_PRESTIGE.toFixed(2)}
            </p>
          </div>
        )}

        {rows.length === 0 && <p className="p-note">No pending submissions.</p>}
        {rows.map(({ submission: s, tier }) => (
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
                        ? `${s.merchantName} — RM ${Number(s.subsidyAmountRm ?? 0).toLocaleString()} subsidy`
                        : `${s.metaAdsCategory} — RM ${Number(s.adSpendRm ?? 0).toLocaleString()} spend`
                    } · Tier ${tier}`
              }
              depositValueRm={Number(s.depositValueRm ?? 0)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
