import Image from "next/image";
import type { Metadata } from "next";
import { getReferralLeaderboard } from "@/lib/leaderboard";
import { TIER_LABEL, TIER_IMAGE } from "@/lib/commission";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top referrers on AlphasAxis, ranked by verified referrals.",
};

const RANK_MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default async function LeaderboardPage() {
  const rows = await getReferralLeaderboard(50);

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col px-4 py-8">
      <div className="mb-6 flex justify-center">
        <Image src="/logo.png" alt="AlphasAxis" width={180} height={22} className="h-[22px] w-auto" priority />
      </div>

      <p className="eyebrow text-center">Community Leaderboard</p>
      <h1 className="mb-1 text-center text-[26px] font-semibold text-white">Top Referrers</h1>
      <p className="p-note mb-6 text-center">Ranked by verified referrals on AlphasAxis.</p>

      {rows.length === 0 ? (
        <div className="card !mb-0">
          <p className="p-note !mb-0">No referrals yet — be the first on the board.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.rank} className="card !mb-0 flex items-center gap-3">
              <div className="w-8 flex-none text-center text-[15px] font-semibold text-[var(--gold-light)]">
                {RANK_MEDAL[row.rank] ?? row.rank}
              </div>
              <div className="tier-ring flex-none">
                <Image src={TIER_IMAGE[row.tier]} alt={TIER_LABEL[row.tier]} fill sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="row-title truncate">{row.displayName}</p>
                <p className="row-sub">{TIER_LABEL[row.tier]}</p>
              </div>
              <div className="flex-none text-right">
                <p className="row-title !mb-0">{row.referralCount}</p>
                <p className="row-sub">referrals</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="p-note mt-8 text-center">
        Want on the board? <a href="https://alphasaxis.com" className="text-[var(--gold-light)]">Join AlphasAxis</a>.
      </p>
    </div>
  );
}
