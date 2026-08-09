"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { AXISPRESTIGE_TOPIC } from "@/lib/contentKit/topics";
import {
  CANVAS_W,
  CANVAS_H,
  drawSlide,
  loadFonts,
  loadImage,
  type DrawSlideAssets,
} from "@/lib/contentKit/prestigeTemplate";

const SLIDE_LABELS = ["Cover", "Problem", "What We Are", "Get Started"];

export function PrestigeCarouselKit({ code }: { code: string }) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const assetsRef = useRef<{ coinImg: HTMLImageElement; logoImg: HTMLImageElement } | null>(null);

  // Load fonts + static images once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [, coinImg, logoImg] = await Promise.all([
        loadFonts(),
        loadImage("/nft/token.png"),
        loadImage("/logo.png"),
      ]);
      if (cancelled) return;
      assetsRef.current = { coinImg, logoImg };
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Redraw all 4 slides whenever assets are ready or the referral code changes.
  useEffect(() => {
    if (!ready || !assetsRef.current) return;

    const link = `https://alphasaxis.com/?ref=${code}`;
    let cancelled = false;

    QRCode.toDataURL(link, { margin: 1, width: 260, color: { dark: "#0F0D0A", light: "#FCF8F1" } })
      .then((qrDataUrl) => loadImage(qrDataUrl))
      .then((qrImg) => {
        if (cancelled || !assetsRef.current) return;
        const assets: DrawSlideAssets = { ...assetsRef.current, qrImg };
        AXISPRESTIGE_TOPIC.slides.forEach((slide, i) => {
          const canvas = canvasRefs.current[i];
          const ctx = canvas?.getContext("2d");
          if (!ctx) return;
          drawSlide(ctx, i, slide, AXISPRESTIGE_TOPIC.handle, assets);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [ready, code]);

  function downloadSlide(index: number) {
    const canvas = canvasRefs.current[index];
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `alphasaxis-prestige-${index + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  async function downloadAll() {
    setDownloading(true);
    for (let i = 0; i < 4; i++) {
      downloadSlide(i);
      await new Promise((r) => setTimeout(r, 350));
    }
    setDownloading(false);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow !mb-0">PRESTIGE · AxisPrestige</p>
        <button type="button" onClick={downloadAll} disabled={!ready || downloading} className="btn primary !mb-0 !w-auto px-4">
          {downloading ? "Downloading…" : "Download All"}
        </button>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {SLIDE_LABELS.map((label, i) => (
          <div key={label} className="flex w-[260px] flex-none snap-center flex-col gap-2">
            <div
              className="overflow-hidden rounded-[14px] border border-[var(--gold-border)] bg-[var(--card)]"
              style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[i] = el;
                }}
                width={CANVAS_W}
                height={CANVAS_H}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>
            <button
              type="button"
              onClick={() => downloadSlide(i)}
              disabled={!ready}
              className="btn secondary !mb-0"
            >
              {label} — Download
            </button>
          </div>
        ))}
      </div>

      {!ready && <p className="p-note mt-3">Loading fonts and assets…</p>}
    </div>
  );
}
