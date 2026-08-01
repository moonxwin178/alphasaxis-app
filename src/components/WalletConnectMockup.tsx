"use client";

import { useState } from "react";

/**
 * UI-only mockup of the future external-wallet connect flow — no Web3
 * library, no real signature request, nothing on-chain. Lets us settle the
 * UX (which providers, what the confirm screen says, how errors read)
 * before wiring up a real integration.
 */
const PROVIDERS = [
  { id: "metamask", label: "MetaMask" },
  { id: "walletconnect", label: "WalletConnect" },
  { id: "trust", label: "Trust Wallet" },
] as const;

type Step = "closed" | "pick-provider" | "connecting" | "coming-soon";

export function WalletConnectMockup() {
  const [step, setStep] = useState<Step>("closed");
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number] | null>(null);

  if (step === "closed") {
    return (
      <div className="card !mb-0 flex items-center gap-3">
        <div className="card-icon !m-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M16 12h2M3 10h18" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="row-title">Connect a $AXIS wallet</p>
          <p className="row-sub">Preview — link an external wallet to receive $AXIS directly</p>
        </div>
        <button className="badge gold shrink-0" onClick={() => setStep("pick-provider")}>
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="card !mb-0">
      <div className="mb-2 flex items-center justify-between">
        <p className="row-title !mb-0">Connect a wallet</p>
        <span className="badge amber">Preview</span>
      </div>

      {step === "pick-provider" && (
        <div className="flex flex-col gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              className="row"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setProvider(p);
                setStep("connecting");
                setTimeout(() => setStep("coming-soon"), 900);
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="row-title">{p.label}</p>
              </div>
              <div className="chev">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </div>
            </button>
          ))}
          <button className="btn ghost mt-1" onClick={() => setStep("closed")}>
            Cancel
          </button>
        </div>
      )}

      {step === "connecting" && (
        <p className="p-note !mb-0">Waiting for {provider?.label} to respond…</p>
      )}

      {step === "coming-soon" && (
        <>
          <p className="p-note !mb-0">
            Wallet connect isn&apos;t live yet — {provider?.label} support is coming once $AXIS moves on-chain.
            Your mined $AXIS is safely tracked in-app in the meantime.
          </p>
          <button className="btn ghost mt-2" onClick={() => setStep("closed")}>
            Close
          </button>
        </>
      )}
    </div>
  );
}
