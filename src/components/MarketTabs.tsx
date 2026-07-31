"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { redeemVoucher } from "@/app/actions/market";

interface VoucherView {
  id: string;
  title: string;
  description: string;
  costPoints: number;
}

const ICON_STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

const SERVICES = [
  {
    title: "Legal document preparation",
    sub: "Per case",
    note: "Discuss with your consultant",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5" />
      </svg>
    ),
  },
  {
    title: "Property valuation report",
    sub: "Certified valuer",
    note: "Discuss with your consultant",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M20 20l-5-5" />
      </svg>
    ),
  },
  {
    title: "Credit report pull",
    sub: "CCRIS + CTOS",
    note: "Discuss with your consultant",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <path d="M4 20V10M11 20V4M18 20v-7" />
      </svg>
    ),
  },
  {
    title: "Insurance bundling",
    sub: "MRTA / fire insurance",
    note: "Discuss with your consultant",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
      </svg>
    ),
  },
];

const RWA_CATEGORIES = [
  {
    title: "Tokenized Stocks",
    desc: "Fractional shares in listed equities",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
    ),
  },
  {
    title: "Tokenized Real Estate",
    desc: "e.g. KLCC, KL Tower, commercial units",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <path d="M4 21V9l8-6 8 6v12" />
        <path d="M9 21v-7h6v7" />
      </svg>
    ),
  },
  {
    title: "Tokenized Gold",
    desc: "Fractional, vault-backed bullion",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
  },
  {
    title: "Tokenized Silver",
    desc: "Fractional, vault-backed bullion",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </svg>
    ),
  },
  {
    title: "Tokenized Bonds",
    desc: "Fixed-income instruments, on-chain",
    icon: (
      <svg viewBox="0 0 24 24" {...ICON_STROKE}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
];

export function MarketTabs({ vouchers, pointsBalance }: { vouchers: VoucherView[]; pointsBalance: number }) {
  const [tab, setTab] = useState<"services" | "vouchers" | "rwa">("services");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <div className="tabstrip">
        <button className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}>
          Services
        </button>
        <button className={tab === "vouchers" ? "active" : ""} onClick={() => setTab("vouchers")}>
          Vouchers
        </button>
        <button className={tab === "rwa" ? "active" : ""} onClick={() => setTab("rwa")}>
          RWA assets
        </button>
      </div>

      {tab === "services" &&
        SERVICES.map((s) => (
          <Link key={s.title} href="/consultation" className="row">
            <div className="row-icon">{s.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="row-title">{s.title}</p>
              <p className="row-sub">{s.sub}</p>
            </div>
            <div className="row-right">{s.note}</div>
          </Link>
        ))}

      {tab === "vouchers" && (
        <>
          <p className="p-note">Your balance: {pointsBalance.toLocaleString()} pts</p>
          {vouchers.length === 0 && <p className="p-note">No vouchers available right now.</p>}
          {vouchers.map((v) => (
            <div key={v.id} className="row">
              <div className="row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                  <rect x="3" y="8" width="18" height="4" />
                  <rect x="5" y="12" width="14" height="9" />
                  <path d="M12 8v13" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="row-title">{v.title}</p>
                <p className="row-sub">{v.costPoints.toLocaleString()} pts</p>
              </div>
              <button
                className="row-right cursor-pointer bg-transparent"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await redeemVoucher(v.id);
                    setMessage(res?.error ?? "Voucher redeemed.");
                  })
                }
              >
                Redeem
              </button>
            </div>
          ))}
          {message && <p className="p-note mt-1">{message}</p>}
        </>
      )}

      {tab === "rwa" && (
        <div>
          <p className="p-note">
            Real-world assets — brought on-chain by verified issuers, minted against $AXIS and
            stablecoins. Launching in Phase 4, once token utility and governance are live.
          </p>
          <div className="grid2">
            {RWA_CATEGORIES.map((c) => (
              <div key={c.title} className="card !mb-0 flex flex-col gap-2">
                <div className="card-icon !m-0">{c.icon}</div>
                <div>
                  <p className="row-title">{c.title}</p>
                  <p className="row-sub">{c.desc}</p>
                </div>
                <span className="badge amber mt-1 self-start">Coming soon</span>
              </div>
            ))}
            <div className="card !mb-0 flex flex-col items-center justify-center gap-1.5 border-dashed text-center">
              <p className="row-title">Own a real-world asset?</p>
              <p className="row-sub">List it on AlphasAxis</p>
              <span className="badge gold mt-1">Issuer onboarding coming soon</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
