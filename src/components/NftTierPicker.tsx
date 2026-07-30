"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mintNftTier } from "@/app/actions/nft";
import { TIER_IMAGE } from "@/lib/commission";

const TIERS = [
  { key: "AXIS_ZERO", name: "AxisZero", sub: "Entry level", desc: "Platform access, basic earning", mult: "1x" },
  { key: "AXIS_ONE", name: "AxisOne", sub: "Active consultant", desc: "Full CRM access, mining rewards", mult: "1.5x" },
  { key: "AXIS_PRO", name: "AxisPro", sub: "High-performing agent", desc: "Performance multipliers, elevated share", mult: "2x" },
  { key: "AXIS_PRESTIGE", name: "AxisPrestige", sub: "Founding participant", desc: "Lifetime ecosystem rewards, node rights", mult: "3x" },
] as const;

export function NftTierPicker({ returnTo }: { returnTo: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div>
      <p className="p-note">Your NFT tier sets your Agent2Mine multiplier and dashboard access.</p>
      {TIERS.map((t) => (
        <div
          key={t.key}
          onClick={() => setSelected(t.key)}
          className="card flex cursor-pointer items-center gap-3"
          style={{ borderColor: selected === t.key ? "var(--gold-light)" : undefined }}
        >
          <div className="relative h-[58px] w-[42px] flex-none overflow-hidden rounded-[8px] border border-gold-border">
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
      <button
        className="btn primary"
        disabled={!selected || pending}
        onClick={() =>
          startTransition(async () => {
            if (!selected) return;
            await mintNftTier(selected);
            router.push(returnTo);
          })
        }
      >
        {pending ? "Minting…" : "Mint and Continue"}
      </button>
    </div>
  );
}
