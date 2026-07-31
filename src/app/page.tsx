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

const HERO_CARDS = [
  { src: "/nft/axiszero.png", alt: "AxisZero", rot: "-14deg", delay: "0.1s", width: 96, height: 127 },
  { src: "/nft/axisone.png", alt: "AxisOne", rot: "-6deg", delay: "0.2s", width: 96, height: 141 },
  { src: "/nft/axisprestige.png", alt: "AxisPrestige", rot: "4deg", delay: "0.3s", width: 110, height: 155 },
  { src: "/nft/axispro.png", alt: "AxisPro", rot: "13deg", delay: "0.4s", width: 96, height: 134 },
] as const;

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

        <div className="relative z-[2] mt-10 flex h-[160px] items-end justify-center">
          {HERO_CARDS.map((card, i) => (
            <div
              key={card.alt}
              className={`relative overflow-hidden rounded-[10px] border border-gold-border opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.5)] [animation:card-rise_1s_cubic-bezier(0.16,1,0.3,1)_forwards] ${
                i < HERO_CARDS.length - 1 ? "mr-[-20px]" : ""
              }`}
              style={
                {
                  "--rot": card.rot,
                  animationDelay: card.delay,
                  width: card.width,
                  aspectRatio: `${card.width}/${card.height}`,
                  zIndex: i === 2 ? 3 : i === 1 || i === 3 ? 2 : 1,
                } as React.CSSProperties
              }
            >
              <Image src={card.src} alt={card.alt} fill className="object-cover" sizes="110px" />
            </div>
          ))}
        </div>
        <p className="mt-5 text-[11px] font-semibold tracking-[0.04em] text-dim2 uppercase">
          AxisZero to AxisPrestige — pick your founding tier
        </p>
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
