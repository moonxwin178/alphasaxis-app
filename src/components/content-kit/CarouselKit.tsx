"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Topic, Lang } from "@/lib/contentKit/topics";
import { CANVAS_W, CANVAS_H, loadImage, loadFonts } from "@/lib/contentKit/canvasCore";
import { STYLES, type DrawSlideAssets } from "@/lib/contentKit/styles";
import { UI_STRINGS } from "@/lib/contentKit/uiStrings";

const SLIDE_LABELS = ["Cover", "Problem", "What We Are", "Get Started"];

interface LoadedAssets {
  coinImg: HTMLImageElement;
  logoDark: HTMLImageElement;
  logoLight: HTMLImageElement;
}

export function CarouselKit({ code, topic, lang }: { code: string; topic: Topic; lang: Lang }) {
  const t = UI_STRINGS[lang];
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [styleId, setStyleId] = useState(STYLES[0].id);
  const assetsRef = useRef<LoadedAssets | null>(null);

  // Load fonts + static images once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [, coinImg, logoDark, logoLight] = await Promise.all([
        loadFonts(),
        loadImage("/nft/token.png"),
        loadImage("/logo.png"),
        loadImage("/logo-bronze.png"),
      ]);
      if (cancelled) return;
      assetsRef.current = { coinImg, logoDark, logoLight };
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Redraw all 4 slides whenever assets are ready, the code changes, or the style changes.
  useEffect(() => {
    if (!ready || !assetsRef.current) return;

    const style = STYLES.find((s) => s.id === styleId) ?? STYLES[0];
    const link = `https://alphasaxis.com/?ref=${code}`;
    let cancelled = false;

    QRCode.toDataURL(link, { margin: 1, width: 260, color: { dark: "#0F0D0A", light: "#FCF8F1" } })
      .then((qrDataUrl) => loadImage(qrDataUrl))
      .then((qrImg) => {
        if (cancelled || !assetsRef.current) return;
        const assets: DrawSlideAssets = {
          coinImg: assetsRef.current.coinImg,
          logoImg: style.ground === "light" ? assetsRef.current.logoLight : assetsRef.current.logoDark,
          qrImg,
        };
        topic.slidesByLang[lang].forEach((slide, i) => {
          const canvas = canvasRefs.current[i];
          const ctx = canvas?.getContext("2d");
          if (!ctx) return;
          style.drawSlide(ctx, i, slide, topic.handle, lang, assets);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [ready, code, styleId, topic, lang]);

  function slideFilename(index: number) {
    return `alphasaxis-${topic.slug}-${styleId}-${lang}-${index + 1}.png`;
  }

  function downloadSlide(index: number) {
    const canvas = canvasRefs.current[index];
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = slideFilename(index);
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function shareSlide(index: number) {
    const canvas = canvasRefs.current[index];
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], slideFilename(index), { type: "image/png" });

      // Web Share API with a file opens the OS share sheet (IG, TikTok, WhatsApp,
      // X, Messages, etc. all show up there on mobile) -- there's no direct web
      // deep-link for sharing an image straight into IG/TikTok, so this is the
      // real path for those two.
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "AlphasAxis", text: `${topic.label} — ${SLIDE_LABELS[index]}` });
        } catch {
          // user cancelled the share sheet — nothing to do
        }
      } else {
        downloadSlide(index);
      }
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
      <div className="tabstrip">
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={s.id === styleId ? "active" : ""}
            onClick={() => setStyleId(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow !mb-0">{STYLES.find((s) => s.id === styleId)?.label} · {topic.label}</p>
        <button type="button" onClick={downloadAll} disabled={!ready || downloading} className="btn primary !mb-0 !w-auto px-4">
          {downloading ? t.downloading : t.downloadAll}
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
            <div className="grid2">
              <button
                type="button"
                onClick={() => downloadSlide(i)}
                disabled={!ready}
                className="btn secondary !mb-0"
              >
                {t.download}
              </button>
              <button
                type="button"
                onClick={() => shareSlide(i)}
                disabled={!ready}
                className="btn primary !mb-0"
              >
                {t.share}
              </button>
            </div>
          </div>
        ))}
      </div>

      {!ready && <p className="p-note mt-3">{t.loadingAssets}</p>}
    </div>
  );
}
