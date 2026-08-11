import type { SlideContent } from "./topics";
import {
  CANVAS_W,
  CANVAS_H,
  MX,
  type Lang,
  type Tokens,
  readTokens,
  drawGradientHeadline,
  drawEyebrow,
  drawEyebrowTick,
  drawHairlineFrame,
  drawHeroCoin,
  drawHeroCoinHalo,
  drawFooter,
  drawBullets,
  drawSubLines,
  drawQrCard,
  drawQrCardFrame,
} from "./canvasCore";

export interface DrawSlideAssets {
  coinImg: HTMLImageElement;
  logoImg: HTMLImageElement;
  qrImg?: HTMLImageElement;
}

const INK = "#241505";
const BRONZE_C0 = "#B08442";
const BRONZE_C1 = "#6E5228";
const INK_DIM = "rgba(36,21,5,0.6)";
const BORDER = "rgba(107,86,48,0.32)";

/** Decorative-only preamble (no content), reused by drawSlide and by the poster editor to seed a background layer. */
export function drawBackground(ctx: CanvasRenderingContext2D, tokens: Tokens, _lang: Lang, slideIndex: number): void {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = tokens.cream;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawHairlineFrame(ctx, BORDER);
  drawEyebrowTick(ctx, MX, 172, tokens.goldDim);
  if (slideIndex === 0) drawHeroCoinHalo(ctx, tokens.goldLight, 0.45);
  if (slideIndex === 3) drawQrCardFrame(ctx, BORDER);
}

export function drawSlide(
  ctx: CanvasRenderingContext2D,
  slideIndex: number,
  content: SlideContent,
  handle: string,
  lang: Lang,
  assets: DrawSlideAssets
): void {
  const tokens = readTokens();
  const contentWidth = CANVAS_W - MX * 2;

  drawBackground(ctx, tokens, lang, slideIndex);

  drawEyebrow(ctx, content.eyebrow, MX, 172, tokens.goldDim, tokens.goldDim, lang);

  const headlineBottom = drawGradientHeadline(
    ctx,
    content.headline,
    content.keyPhrase,
    MX,
    268,
    contentWidth,
    {
      fontWeight: 300,
      size: 76,
      lineHeight: 82,
      inkColor: INK,
      gradientC0: BRONZE_C0,
      gradientC1: BRONZE_C1,
    },
    lang
  );

  if (slideIndex === 1 || slideIndex === 2) {
    drawBullets(ctx, content.body, MX, headlineBottom + 50, contentWidth, { markerColor: tokens.goldDim, textColor: INK_DIM }, lang);
  } else {
    drawSubLines(ctx, content.body[0], MX, headlineBottom + 44, contentWidth * 0.82, INK_DIM, lang);
  }

  if (slideIndex === 0) {
    drawHeroCoin(ctx, assets.coinImg, tokens.goldLight, 0.45);
  }

  if (slideIndex === 3 && assets.qrImg) {
    drawQrCard(ctx, assets.qrImg, BORDER, tokens.goldDim, lang);
  }

  drawFooter(ctx, assets.logoImg, slideIndex, handle, INK_DIM);
}
