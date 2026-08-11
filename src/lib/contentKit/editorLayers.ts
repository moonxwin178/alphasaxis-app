import type { SlideContent, Lang } from "./topics";
import { CANVAS_W, CANVAS_H, MX, HERO_COIN_POS, QR_CARD_POS, SCAN_LABEL, wrapWords, font, type Tokens } from "./canvasCore";

export interface TextLayerSpec {
  kind: "text";
  id: string;
  text: string;
  left: number;
  top: number;
  width: number;
  fontSize: number;
  fontWeight: number;
  textAlign: "left" | "center" | "right";
  fill: string;
  /** Left-to-right gradient fill, used instead of `fill` when present (headline only). */
  gradient?: { from: string; to: string };
  /** Overrides the lang-based default font family (used for the ticker style's monospace footer). */
  fontFamily?: string;
}

export interface ImageLayerSpec {
  kind: "image";
  id: string;
  source: HTMLImageElement | string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export type LayerSpec = TextLayerSpec | ImageLayerSpec;

export interface EditorAssets {
  coinImg: HTMLImageElement;
  logoImg: HTMLImageElement;
  qrImg?: HTMLImageElement;
}

/** Approximate the top of a text box from a Canvas2D fillText baseline, for a font's default ascent. */
function topFromBaseline(baselineY: number, fontSize: number): number {
  return baselineY - fontSize * 0.78;
}

interface StyleLayoutConfig {
  eyebrowY: number;
  eyebrowColor: string;
  headline: {
    y: number;
    fontWeight: number;
    size: number;
    lineHeight: number;
    ink: string;
    gradient: { from: string; to: string } | null;
  };
  bodyOffset: { bullets: number; subLines: number };
  bulletMarker: "•" | "✓";
  bulletMarkerColor: string;
  bodyTextColor: string;
  footer: { fontSize: number; mono: boolean; textColor: string };
  qrLabelColor: string;
}

function getLayoutConfig(styleId: string, tokens: Tokens): StyleLayoutConfig {
  switch (styleId) {
    case "champagne": {
      const INK = "#241505";
      const INK_DIM = "rgba(36,21,5,0.6)";
      return {
        eyebrowY: 172,
        eyebrowColor: tokens.goldDim,
        headline: { y: 268, fontWeight: 300, size: 76, lineHeight: 82, ink: INK, gradient: { from: "#B08442", to: "#6E5228" } },
        bodyOffset: { bullets: 50, subLines: 44 },
        bulletMarker: "•",
        bulletMarkerColor: tokens.goldDim,
        bodyTextColor: INK_DIM,
        footer: { fontSize: 24, mono: false, textColor: INK_DIM },
        qrLabelColor: tokens.goldDim,
      };
    }
    case "ticker":
      return {
        eyebrowY: 220,
        eyebrowColor: tokens.gold,
        headline: { y: 316, fontWeight: 300, size: 72, lineHeight: 78, ink: tokens.white, gradient: { from: tokens.goldLight, to: tokens.gold } },
        bodyOffset: { bullets: 46, subLines: 40 },
        bulletMarker: "•",
        bulletMarkerColor: tokens.gold,
        bodyTextColor: tokens.dim,
        footer: { fontSize: 13, mono: true, textColor: tokens.dim },
        qrLabelColor: tokens.goldLight,
      };
    case "creative":
      return {
        eyebrowY: 172,
        eyebrowColor: tokens.goldLight,
        headline: { y: 268, fontWeight: 600, size: 68, lineHeight: 76, ink: tokens.white, gradient: { from: tokens.goldLight, to: tokens.gold } },
        bodyOffset: { bullets: 50, subLines: 44 },
        bulletMarker: "•",
        bulletMarkerColor: tokens.gold,
        bodyTextColor: tokens.dim,
        footer: { fontSize: 24, mono: false, textColor: tokens.dim },
        qrLabelColor: tokens.goldLight,
      };
    case "viral":
      return {
        eyebrowY: 172,
        eyebrowColor: tokens.goldLight,
        // Original renders a gold highlight block behind the key phrase, which doesn't map to a simple
        // 2-stop fill -- the editable layer starts as plain white; users can recolor it themselves.
        headline: { y: 280, fontWeight: 600, size: 80, lineHeight: 90, ink: tokens.white, gradient: null },
        bodyOffset: { bullets: 50, subLines: 44 },
        bulletMarker: "✓",
        bulletMarkerColor: tokens.gold,
        bodyTextColor: tokens.dim,
        footer: { fontSize: 24, mono: false, textColor: tokens.dim },
        qrLabelColor: tokens.goldLight,
      };
    case "prestige":
    default:
      return {
        eyebrowY: 172,
        eyebrowColor: tokens.gold,
        headline: { y: 268, fontWeight: 300, size: 76, lineHeight: 82, ink: tokens.white, gradient: { from: tokens.goldLight, to: tokens.gold } },
        bodyOffset: { bullets: 50, subLines: 44 },
        bulletMarker: "•",
        bulletMarkerColor: tokens.gold,
        bodyTextColor: tokens.dim,
        footer: { fontSize: 24, mono: false, textColor: tokens.dim },
        qrLabelColor: tokens.goldLight,
      };
  }
}

const MONO = '"SFMono-Regular", Consolas, monospace';

/**
 * Builds the independently-editable Fabric layers for a slide: eyebrow, headline, body text,
 * hero coin / QR images (slide-dependent), logo, and footer index/handle text. Everything else
 * (frame, glow, grid, ticker strip, ghost numeral, arc accent, gold pill, card borders) is baked
 * into the style's flattened `drawBackground()` render instead.
 */
export function getEditableLayers(
  ctx: CanvasRenderingContext2D,
  styleId: string,
  slideIndex: number,
  content: SlideContent,
  handle: string,
  lang: Lang,
  tokens: Tokens,
  assets: EditorAssets
): LayerSpec[] {
  const cfg = getLayoutConfig(styleId, tokens);
  const contentWidth = CANVAS_W - MX * 2;
  const layers: LayerSpec[] = [];

  // Eyebrow
  layers.push({
    kind: "text",
    id: "eyebrow",
    text: content.eyebrow.toUpperCase(),
    left: MX,
    top: topFromBaseline(cfg.eyebrowY + 42, 26),
    width: contentWidth,
    fontSize: 26,
    fontWeight: 600,
    textAlign: "left",
    fill: cfg.eyebrowColor,
  });

  // Headline (measure line count with the real wrap logic so the body below starts in the right place)
  const headlineFontStr = font(cfg.headline.fontWeight, cfg.headline.size, lang);
  const headlineLines = wrapWords(ctx, content.headline, headlineFontStr, contentWidth, lang);
  const headlineBottom = cfg.headline.y + headlineLines.length * cfg.headline.lineHeight;

  layers.push({
    kind: "text",
    id: "headline",
    text: content.headline,
    left: MX,
    top: topFromBaseline(cfg.headline.y, cfg.headline.size),
    width: contentWidth,
    fontSize: cfg.headline.size,
    fontWeight: cfg.headline.fontWeight,
    textAlign: "left",
    fill: cfg.headline.ink,
    gradient: cfg.headline.gradient ?? undefined,
  });

  // Body: bullets on Problem/What-It-Is slides, a single sub-line on Cover/CTA
  if (slideIndex === 1 || slideIndex === 2) {
    let bulletTop = topFromBaseline(headlineBottom + cfg.bodyOffset.bullets, 32);
    content.body.forEach((bullet, i) => {
      layers.push({
        kind: "text",
        id: `bullet-${i}`,
        text: `${cfg.bulletMarker}  ${bullet}`,
        left: MX,
        top: bulletTop,
        width: contentWidth,
        fontSize: 32,
        fontWeight: 400,
        textAlign: "left",
        fill: cfg.bodyTextColor,
      });
      bulletTop += 46 * Math.ceil(bullet.length / 46) + 22; // rough multi-line + row-gap allowance; user can drag to fit
    });
  } else {
    layers.push({
      kind: "text",
      id: "subline",
      text: content.body[0],
      left: MX,
      top: topFromBaseline(headlineBottom + cfg.bodyOffset.subLines, 32),
      width: contentWidth * 0.82,
      fontSize: 32,
      fontWeight: 400,
      textAlign: "left",
      fill: cfg.bodyTextColor,
    });
  }

  // Hero coin (cover slide only)
  if (slideIndex === 0) {
    const { cx, cy, size } = HERO_COIN_POS;
    layers.push({
      kind: "image",
      id: "coin",
      source: assets.coinImg,
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
    });
  }

  // QR code + scan label (CTA slide only)
  if (slideIndex === 3 && assets.qrImg) {
    const { cardX, cardY, qrSize, cardW } = QR_CARD_POS;
    layers.push({
      kind: "image",
      id: "qr",
      source: assets.qrImg,
      left: cardX + (cardW - qrSize) / 2,
      top: cardY + 34,
      width: qrSize,
      height: qrSize,
    });
    layers.push({
      kind: "text",
      id: "qr-label",
      text: SCAN_LABEL[lang],
      left: CANVAS_W / 2 - cardW / 2,
      top: topFromBaseline(cardY + qrSize + 70, 22),
      width: cardW,
      fontSize: 22,
      fontWeight: 600,
      textAlign: "center",
      fill: cfg.qrLabelColor,
    });
  }

  // Footer logo + index/handle
  const footerY = CANVAS_H - 96;
  const logoW = 190;
  const logoH = logoW * (assets.logoImg.naturalHeight / assets.logoImg.naturalWidth);
  layers.push({
    kind: "image",
    id: "logo",
    source: assets.logoImg,
    left: MX,
    top: footerY - logoH / 2,
    width: logoW,
    height: logoH,
  });
  const index = `${String(slideIndex + 1).padStart(2, "0")}/04`;
  layers.push({
    kind: "text",
    id: "footer-text",
    text: `${index}   ${handle}`,
    left: CANVAS_W - MX - 400,
    top: topFromBaseline(footerY + cfg.footer.fontSize / 2, cfg.footer.fontSize),
    width: 400,
    fontSize: cfg.footer.fontSize,
    fontWeight: 400,
    textAlign: "right",
    fill: cfg.footer.textColor,
    fontFamily: cfg.footer.mono ? MONO : undefined,
  });

  return layers;
}
