"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitNodeVerification } from "@/app/actions/nft";
import { TIER_IMAGE } from "@/lib/commission";

const AUTO_TIERS = [
  { key: "AXIS_ZERO", name: "AxisZero", sub: "Every account, automatically", desc: "No action needed — this is your tier the moment you sign up.", mult: "0.5x" },
  { key: "AXIS_ONE", name: "AxisOne", sub: "Agent identity", desc: "Unlocked automatically once your Agent application is approved.", mult: "1.5x" },
  { key: "AXIS_PRO", name: "AxisPro", sub: "Agency identity", desc: "Unlocked automatically once your Agency application is approved.", mult: "2x" },
] as const;

export function NftTierPicker({ returnTo }: { returnTo: string }) {
  const [wallet, setWallet] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  return (
    <div>
      <p className="p-note">
        AxisZero, AxisOne, and AxisPro are granted automatically — nothing to mint here.
      </p>
      {AUTO_TIERS.map((t) => (
        <div key={t.key} className="card flex items-center gap-3">
          <div className="relative h-[58px] w-[42px] flex-none overflow-hidden rounded-[8px] border border-gold-border opacity-60">
            <Image src={TIER_IMAGE[t.key]} alt={t.name} fill sizes="42px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="row-title">
              {t.name} — {t.sub}
            </p>
            <p className="row-sub">{t.desc}</p>
            <span className="badge gold mt-1.5 inline-block">{t.mult} multiplier</span>
          </div>
        </div>
      ))}

      <div className="divider" />

      <div className="card flex items-center gap-3">
        <div className="relative h-[58px] w-[42px] flex-none overflow-hidden rounded-[8px] border border-gold-border">
          <Image src={TIER_IMAGE.AXIS_PRESTIGE} alt="AxisPrestige" fill sizes="42px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="row-title">AxisPrestige — Node holder</p>
          <p className="row-sub">
            Minted on app.turbox.bond/node-pad, not here. Enter the wallet that holds your Node to
            request verification — an admin confirms on-chain ownership before the 3x multiplier
            applies.
          </p>
        </div>
      </div>

      {submitted ? (
        <p className="p-note">Verification requested. We&apos;ll confirm it shortly.</p>
      ) : (
        <div className="field">
          <label htmlFor="wallet">Node holder wallet address</label>
          <input
            id="wallet"
            type="text"
            placeholder="0x…"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
          />
        </div>
      )}

      {error && <p className="p-note text-[var(--red)]">{error}</p>}

      {!submitted && (
        <button
          className="btn primary"
          disabled={!wallet.trim() || pending}
          onClick={() =>
            startTransition(async () => {
              const res = await submitNodeVerification(wallet.trim());
              if (res?.error) {
                setError(res.error);
                return;
              }
              setError(null);
              setSubmitted(true);
              setTimeout(() => router.push(returnTo), 1400);
            })
          }
        >
          {pending ? "Submitting…" : "Request Verification"}
        </button>
      )}
    </div>
  );
}
