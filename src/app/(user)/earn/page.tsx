import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { getPointsBalance } from "@/lib/points";
import { AppHeader } from "@/components/AppHeader";

const REASON_LABEL: Record<string, string> = {
  SPEND_TO_EARN: "Spend proof approved",
  SUBMIT_TO_EARN: "Task submitted",
  NETWORK_TO_EARN: "Referral converted",
  SOCIAL_TO_EARN: "Daily check-in",
  CONSULTATION: "Consultation submitted",
  REFERRAL_BONUS: "Referral bonus",
  ADMIN_ADJUST: "Adjustment",
};

export default async function EarnPage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const [balance, recent] = await Promise.all([
    getPointsBalance(user.id),
    prisma.pointsLedgerEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div>
      <AppHeader title="Rewards and Points" />
      <div className="px-4 pt-4">
        <div className="card p-5 text-center">
          <p className="eyebrow flex items-center justify-center gap-1.5">
            <Image src="/nft/token.png" alt="$AXIS" width={13} height={13} className="rounded-full" />
            $AXIS points balance
          </p>
          <p className="my-1 text-[28px] font-extrabold text-white">{balance.toLocaleString()}</p>
        </div>

        <div className="card !mb-3.5 flex items-center gap-3 border-[var(--gold-light)] bg-[linear-gradient(135deg,rgba(255,218,164,0.1),rgba(158,124,69,0.04))]">
          <div className="card-icon !m-0 bg-[linear-gradient(135deg,var(--gold-light),var(--gold))] text-[#241505]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">Quick win: daily check-in</p>
            <p className="row-sub">+5 pts, once a day, takes 2 seconds</p>
          </div>
          <Link href="/earn/social" className="badge gold shrink-0">
            Check in
          </Link>
        </div>

        <div className="grid2 my-3.5">
          <Link href="/earn/spend" className="card cursor-pointer text-center">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="8" cy="8" r="5.5" />
                <circle cx="15" cy="15.5" r="5.5" />
              </svg>
            </div>
            <p className="row-title mt-0.5">Spend to Earn</p>
            <p className="row-sub">Upload a receipt</p>
          </Link>
          <Link href="/earn/submit" className="card cursor-pointer text-center">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M7 3h7l5 5v13H7z" />
                <path d="M14 3v5h5" />
              </svg>
            </div>
            <p className="row-title mt-0.5">Submit to Earn</p>
            <p className="row-sub">+20 to +100 pts</p>
          </Link>
          <Link href="/earn/network" className="card cursor-pointer text-center">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="9" cy="8" r="3.3" />
                <circle cx="17" cy="9" r="2.6" />
                <path d="M2.5 20c1.2-3.6 4-5.5 6.5-5.5s5.3 1.9 6.5 5.5M15 14.7c2 .2 4 1.7 4.8 4" />
              </svg>
            </div>
            <p className="row-title mt-0.5">Network to Earn</p>
            <p className="row-sub">Refer & earn per case</p>
          </Link>
          <Link href="/earn/social" className="card cursor-pointer text-center">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
              </svg>
            </div>
            <p className="row-title mt-0.5">Social to Earn</p>
            <p className="row-sub">+5 pts daily check-in</p>
          </Link>
        </div>

        <p className="eyebrow">Recent activity</p>
        {recent.length === 0 && <p className="p-note">No activity yet.</p>}
        {recent.map((entry) => (
          <div key={entry.id} className="row">
            <div className="row-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-[17px] w-[17px]">
                <path d="M4 12l6 6L20 6" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="row-title">{REASON_LABEL[entry.reason] ?? entry.reason}</p>
              <p className="row-sub">{new Date(entry.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="row-right">
              {entry.delta > 0 ? "+" : ""}
              {entry.delta} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
