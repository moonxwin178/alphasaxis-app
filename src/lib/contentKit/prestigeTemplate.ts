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
  drawFaintGlow,
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

/** Decorative-only preamble (no content), reused by drawSlide and by the poster editor to seed a background layer. */
export function drawBackground(ctx: CanvasRenderingContext2D, tokens: Tokens, _lang: Lang, slideIndex: number): void {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = tokens.black;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawFaintGlow(ctx, tokens.gold);
  drawHairlineFrame(ctx, tokens.goldBorder);
  drawEyebrowTick(ctx, MX, 172, tokens.gold);
  if (slideIndex === 0) drawHeroCoinHalo(ctx, tokens.gold);
  if (slideIndex === 3) drawQrCardFrame(ctx, tokens.goldBorder);
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

  drawEyebrow(ctx, content.eyebrow, MX, 172, tokens.gold, tokens.goldLight, lang);

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
      inkColor: tokens.white,
      gradientC0: tokens.goldLight,
      gradientC1: tokens.gold,
    },
    lang
  );

  if (slideIndex === 1 || slideIndex === 2) {
    drawBullets(ctx, content.body, MX, headlineBottom + 50, contentWidth, { markerColor: tokens.gold, textColor: tokens.dim }, lang);
  } else {
    drawSubLines(ctx, content.body[0], MX, headlineBottom + 44, contentWidth * 0.82, tokens.dim, lang);
  }

  if (slideIndex === 0) {
    drawHeroCoin(ctx, assets.coinImg, tokens.gold);
  }

  if (slideIndex === 3 && assets.qrImg) {
    drawQrCard(ctx, assets.qrImg, tokens.goldBorder, tokens.goldLight, lang);
  }

  drawFooter(ctx, assets.logoImg, slideIndex, handle, tokens.dim);
}
