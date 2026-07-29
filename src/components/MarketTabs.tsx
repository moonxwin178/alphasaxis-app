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

const SERVICES = [
  { title: "Legal document preparation", sub: "Per case", note: "Discuss with your consultant" },
  { title: "Property valuation report", sub: "Certified valuer", note: "Discuss with your consultant" },
  { title: "Credit report pull", sub: "CCRIS + CTOS", note: "Discuss with your consultant" },
  { title: "Insurance bundling", sub: "MRTA / fire insurance", note: "Discuss with your consultant" },
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
            <div className="row-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
                <path d="M7 3h7l5 5v13H7z" />
                <path d="M14 3v5h5" />
              </svg>
            </div>
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
        <div className="card" style={{ borderColor: "rgba(158,124,69,.4)" }}>
          <p className="row-title mb-1">Coming in Phase 4</p>
          <p className="row-sub">Real-world asset marketplace unlocks with token utility and governance.</p>
        </div>
      )}
    </div>
  );
}
