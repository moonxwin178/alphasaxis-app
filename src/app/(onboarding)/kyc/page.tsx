import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { KycDocRow } from "@/components/KycDocRow";
import { NationalitySelect } from "@/components/NationalitySelect";
import { submitKycForReview } from "@/app/actions/kyc";

export default async function KycPage() {
  const user = await requireUser();
  const prisma = getPrisma();

  const submission = await prisma.kycSubmission.findUnique({
    where: { userId: user.id },
    include: { documents: true },
  });

  const statusFor = (docType: "NRIC_PASSPORT" | "SELFIE" | "PROOF_OF_ADDRESS") =>
    submission?.documents.find((d) => d.docType === docType)?.status ?? "none";

  const uploadedCount = submission?.documents.length ?? 0;
  const allUploaded = uploadedCount >= 3;
  const alreadySubmitted = submission?.status === "PENDING" || submission?.status === "VERIFIED";

  return (
    <div>
      <AppHeader title="Identity Verification" backHref="/cases" />
      <div className="px-4 pt-4">
        <p className="p-note">Verify your identity to unlock consultations, payouts and NFT minting.</p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${Math.min(uploadedCount, 3) * 33.3}%` }} />
        </div>
        <p className="p-note mt-1">{uploadedCount} of 3 documents uploaded</p>

        <NationalitySelect initialValue={submission?.nationality ?? null} />

        <KycDocRow
          docType="NRIC_PASSPORT"
          label="NRIC / passport — front and back"
          sub="Tap to upload"
          status={statusFor("NRIC_PASSPORT")}
        />
        <KycDocRow docType="SELFIE" label="Selfie verification" sub="Live capture required" status={statusFor("SELFIE")} />
        <KycDocRow
          docType="PROOF_OF_ADDRESS"
          label="Proof of address"
          sub="Utility bill or bank statement"
          status={statusFor("PROOF_OF_ADDRESS")}
        />

        {alreadySubmitted ? (
          <div className="card mt-3 text-center" style={{ borderColor: "rgba(143,201,143,.4)" }}>
            <p className="mb-1 font-extrabold text-[var(--green)]">
              {submission?.status === "VERIFIED" ? "Verified" : "Submitted for review"}
            </p>
            <p className="p-note m-0">
              {submission?.status === "VERIFIED"
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
            <button className="btn primary mt-3" type="submit" disabled={!allUploaded}>
              Submit for Verification
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
