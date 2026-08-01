import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { CheckInButton } from "@/components/CheckInButton";
import { SocialTaskRow } from "@/components/SocialTaskRow";
import { getSocialTaskStatus } from "@/app/actions/earn";

export default async function EarnSocialPage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayCheckIn, recent, socialTasks] = await Promise.all([
    prisma.checkIn.findUnique({ where: { userId_date: { userId: user.id, date: today } } }),
    prisma.checkIn.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 7 }),
    getSocialTaskStatus(user.id),
  ]);

  const streak = todayCheckIn?.streakCount ?? recent[0]?.streakCount ?? 0;
  const checkedDates = new Set(recent.map((r) => r.date.toISOString().slice(0, 10)));

  return (
    <div>
      <AppHeader title="Social to Earn" backHref="/earn" />
      <div className="px-4 pt-4">
        <div className="card text-center">
          <p className="eyebrow">Check-in streak</p>
          <p className="my-1 text-[24px] font-extrabold text-white">{streak} days</p>
          <div className="mt-2 flex justify-center gap-[5px]">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(today);
              d.setDate(d.getDate() - (6 - i));
              const active = checkedDates.has(d.toISOString().slice(0, 10));
              return (
                <div
                  key={i}
                  className="h-4 w-4 rounded-[5px]"
                  style={{
                    background: active
                      ? "linear-gradient(135deg,var(--gold-light),var(--gold))"
                      : "var(--card2)",
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="row">
          <div className="row-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-[17px] w-[17px]">
              <path d="M4 12l6 6L20 6" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">Daily check-in</p>
            <p className="row-sub">+5 pts</p>
          </div>
          <CheckInButton alreadyCheckedIn={!!todayCheckIn} />
        </div>

        <p className="eyebrow mt-4">Follow & join</p>
        {socialTasks.map((t) => (
          <SocialTaskRow
            key={t.key}
            taskKey={t.key}
            label={t.label}
            points={t.points}
            href={t.href}
            claimed={t.claimed}
            started={t.started}
          />
        ))}
      </div>
    </div>
  );
}
