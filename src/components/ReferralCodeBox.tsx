"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function ReferralCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    const referralLink = `${origin}/register?ref=${code}`;
    setLink(referralLink);
    setCanNativeShare(typeof navigator.share === "function");
    QRCode.toDataURL(referralLink, { margin: 1, width: 240, color: { dark: "#0F0D0A", light: "#FCF8F1" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [code]);

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    if (canNativeShare) {
      try {
        await navigator.share({ title: "Join me on AlphasAxis", text: "Sign up with my referral link:", url: link });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `alphasaxis-referral-${code}.png`;
    a.click();
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`Join me on AlphasAxis: ${link}`)}`;

  return (
    <div className="card !mb-0">
      <p className="row-title">Your referral code</p>
      <button
        type="button"
        onClick={copy}
        className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-[var(--gold-border)] bg-[var(--card2)] px-3 py-2.5 text-[13px] font-bold text-white"
      >
        <span>{code}</span>
        <span className="text-gold-light">{copied ? "Copied!" : "Copy link"}</span>
      </button>

      {qrDataUrl && (
        <div className="mt-3 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL, next/image can't optimize it */}
          <img src={qrDataUrl} alt="Referral QR code" width={140} height={140} className="rounded-[10px]" />
          <button type="button" onClick={downloadQr} className="text-[11.5px] font-bold text-gold-light">
            Save QR as image
          </button>
        </div>
      )}

      <div className="grid2 mt-3">
        {canNativeShare && (
          <button type="button" className="btn secondary !mb-0" onClick={share}>
            Share
          </button>
        )}
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`btn ${canNativeShare ? "ghost" : "secondary"} !mb-0`}>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
