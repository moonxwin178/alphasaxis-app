import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

const HOME_BY_ROLE: Record<string, string> = {
  USER: "/cases",
  AGENT: "/agent/pipeline",
  AGENCY: "/agency/agents",
  ADMIN: "/admin/users",
};

const ICON_STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

const FEATURES = [
  {
    label: "Cases",
    desc: "Track financing end to end",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <path d="M3 7h18v12H3z" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
  {
    label: "Rewards",
    desc: "Earn $AXIS as you go",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <circle cx="8" cy="8" r="5.5" />
        <circle cx="15" cy="15.5" r="5.5" />
      </svg>
    ),
  },
  {
    label: "Wallet",
    desc: "Your balance, always visible",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <circle cx="16.5" cy="14" r="1" />
      </svg>
    ),
  },
  {
    label: "Marketplace",
    desc: "Services, vouchers & assets",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <path d="M4 8l1.5-4h13L20 8" />
        <path d="M4 8h16v11H4z" />
        <path d="M9 12a3 3 0 0 0 6 0" />
      </svg>
    ),
  },
];

export default async function RootPage() {
  const user = await verifySession();
  if (user) redirect(HOME_BY_ROLE[user.role] ?? "/cases");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col sm:border-x sm:border-[var(--gold-border)]">
      <div
        className="relative flex flex-1 flex-col items-center justify-center px-6 py-14 text-center"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(158,124,69,0.22), transparent 65%)",
        }}
      >
        <Image src="/logo.png" alt="AlphasAxis" width={220} height={27} className="h-[26px] w-auto" priority />

        <h1 className="mt-9 max-w-[320px] text-[27px] leading-[1.2] font-[800]">
          Your Financing Journey, <span className="gold-text">On-Chain.</span>
        </h1>
        <p className="mt-3 max-w-[300px] text-[13.5px] leading-[1.6] text-dim">
          Track cases, earn $AXIS, and manage your founding node — all from one app.
        </p>

        <div className="mt-10 grid w-full grid-cols-2 gap-2.5">
          {FEATURES.map((f) => (
            <div key={f.label} className="card !mb-0 flex flex-col items-center gap-2 py-5 text-center">
              <div className="text-gold-light">{f.icon}</div>
              <div>
                <p className="text-[12.5px] font-[800]">{f.label}</p>
                <p className="mt-0.5 text-[10.5px] leading-[1.4] text-dim2">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pt-2 pb-9">
        <Link href="/register" className="btn primary">
          Create Account
        </Link>
        <Link href="/login" className="btn ghost mt-2.5">
          Log In
        </Link>
        <p className="mt-4 text-center text-[10.5px] leading-[1.5] text-dim3">
          By continuing, you agree to our Terms and acknowledge the Risk Disclosure.
        </p>
      </div>
    </div>
  );
}
