import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { SpendProofForm } from "@/components/SpendProofForm";
import { PetrolBrandIcon } from "@/components/PetrolBrandIcon";

const STATUS_BADGE: Record<string, string> = {
  PENDING: '<span class="badge amber">Review</span>',
  VERIFIED: '<span class="badge green">Approved</span>',
  REJECTED: '<span class="badge red">Rejected</span>',
};

const PETROL_BRANDS = ["Shell", "Petron", "Petronas"] as const;

export default async function EarnSpendPage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();
  const submissions = await prisma.receiptUpload.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AppHeader title="Spend to Earn" backHref="/earn" />
      <div className="px-4 pt-4">
        <p className="p-note">
          Upload proof of business spend — approved submissions earn points. Our team reviews each
          submission manually.
        </p>
        <SpendProofForm />

        <p className="eyebrow mt-6">Petrol subsidy — real $AXIS, not points</p>
        <p className="p-note !mb-1">
          These deposit your government petrol subsidy into your Agent2Mine pool — a separate, bigger reward than
          the generic upload above. Pick your station.
        </p>
        {PETROL_BRANDS.map((brand) => (
          <Link
            key={brand}
            href={`/earn/mine?station=${brand}#petrol-form`}
            className="row"
          >
            <div className="row-icon !bg-white">
              <PetrolBrandIcon brand={brand} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="row-title">Petrol Subsidy for {brand}</p>
              <p className="row-sub">Deposits to your mining pool</p>
            </div>
            <div className="chev">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
        ))}

        <p className="eyebrow mt-6">Past submissions</p>
        {submissions.length === 0 && <p className="p-note">No submissions yet.</p>}
        {submissions.map((s) => (
          <div key={s.id} className="row">
            <div className="row-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                <path d="M7 3h7l5 5v13H7z" />
                <path d="M14 3v5h5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="row-title">Receipt uploaded</p>
              <p className="row-sub">{new Date(s.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="row-right" dangerouslySetInnerHTML={{ __html: STATUS_BADGE[s.status] }} />
          </div>
        ))}
      </div>
    </div>
  );
}
