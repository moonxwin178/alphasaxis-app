import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { KycDocRow } from "@/components/KycDocRow";
import { NationalitySelect } from "@/components/NationalitySelect";
import { IdentityNumberField } from "@/components/IdentityNumberField";
import { getMiningConfig } from "@/lib/miningConfig";
import { submitAdvancedKyc, submitKycForReview } from "@/app/actions/kyc";

export default async function KycPage() {
  const user = await requireUser();
  const prisma = getPrisma();

  const [submission, config] = await Promise.all([
    prisma.kycSubmission.findUnique({ where: { userId: user.id }, include: { documents: true } }),
    getMiningConfig(),
  ]);

  const statusFor = (docType: "NRIC_PASSPORT" | "SELFIE" | "PROOF_OF_ADDRESS") =>
    submission?.documents.find((d) => d.docType === docType)?.status ?? "none";

  const hasNric = !!submission?.documents.some((d) => d.docType === "NRIC_PASSPORT");
  const hasIdentityNumber = !!submission?.identityNumber;
  const standardStepsDone = [hasIdentityNumber, !!submission?.nationality, hasNric].filter(Boolean).length;
  const canSubmitStandard = hasNric && hasIdentityNumber;
  const standardAlreadySubmitted = submission?.status === "PENDING" || submission?.status === "VERIFIED";
  const standardVerified = submission?.status === "VERIFIED";

  const hasSelfie = !!submission?.documents.some((d) => d.docType === "SELFIE");
  const hasAddress = !!submission?.documents.some((d) => d.docType === "PROOF_OF_ADDRESS");
  const canSubmitAdvanced = hasSelfie && hasAddress;
  const advancedAlreadySubmitted =
    submission?.advancedStatus === "PENDING" || submission?.advancedStatus === "VERIFIED";
  const quotaBoostPct = Math.round((config.advancedKycQuotaBoost - 1) * 100);
  const earnBoostPct = Math.round((config.advancedKycEarnBoost - 1) * 100);

  return (
    <div>
      <AppHeader title="Identity Verification" backHref="/cases" />
      <div className="px-4 pt-4">
        <p className="eyebrow mb-1">Standard verification</p>
        <p className="p-note">Verify your identity to unlock consultations, payouts and NFT minting.</p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${Math.min(standardStepsDone, 3) * 33.3}%` }} />
        </div>
        <p className="p-note mt-1">{standardStepsDone} of 3 steps complete</p>

        <NationalitySelect initialValue={submission?.nationality ?? null} />
        <IdentityNumberField initialValue={submission?.identityNumber ?? null} />

        <KycDocRow
          docType="NRIC_PASSPORT"
          label="NRIC / passport — front and back"
          sub="Tap to upload"
          status={statusFor("NRIC_PASSPORT")}
        />

        {standardAlreadySubmitted ? (
          <div className="card mt-3 text-center" style={{ borderColor: "rgba(143,201,143,.4)" }}>
            <p className="mb-1 font-extrabold text-[var(--green)]">
              {standardVerified ? "Standard verified" : "Submitted for review"}
            </p>
            <p className="p-note m-0">
              {standardVerified
                ? "Your identity has been verified."
                : "Our team will review your documents shortly."}
            </p>
          </div>
        ) : (
          <form
            action={async (formData: FormData) => {
              "use server";
              await submitKycForReview(formData);
            }}
          >
            <button className="btn primary mt-3" type="submit" disabled={!canSubmitStandard}>
              Submit for Verification
            </button>
          </form>
        )}

        {standardVerified && (
          <>
            <p className="eyebrow mb-1 mt-6">Advanced verification</p>
            <p className="p-note">
              Add a live selfie and proof of address to unlock a <b>+{quotaBoostPct}%</b> Agent2Mine deposit quota
              and a <b>+{earnBoostPct}%</b> $AXIS earn rate on every task.
            </p>

            <KycDocRow docType="SELFIE" label="Selfie verification" sub="Live capture required" status={statusFor("SELFIE")} />
            <KycDocRow
              docType="PROOF_OF_ADDRESS"
              label="Proof of address"
              sub="Utility bill or bank statement"
              status={statusFor("PROOF_OF_ADDRESS")}
            />

            {advancedAlreadySubmitted ? (
              <div className="card mt-3 text-center" style={{ borderColor: "rgba(143,201,143,.4)" }}>
                <p className="mb-1 font-extrabold text-[var(--green)]">
                  {submission?.advancedStatus === "VERIFIED" ? "Advanced verified" : "Submitted for review"}
                </p>
                <p className="p-note m-0">
                  {submission?.advancedStatus === "VERIFIED"
                    ? "Your boosted quota and earn rate are active."
                    : "Our team will review your documents shortly."}
                </p>
              </div>
            ) : (
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await submitAdvancedKyc(formData);
                }}
              >
                <button className="btn secondary mt-3" type="submit" disabled={!canSubmitAdvanced}>
                  Submit for Advanced Verification
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
