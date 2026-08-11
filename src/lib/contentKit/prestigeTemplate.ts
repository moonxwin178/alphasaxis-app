import type { SlideContent } from "./topics";
import {
  CANVAS_W,
  CANVAS_H,
  MX,
  type Lang,
  readTokens,
  drawGradientHeadline,
  drawEyebrow,
  drawHairlineFrame,
  drawFaintGlow,
  drawHeroCoin,
  drawFooter,
  drawBullets,
  drawSubLines,
  drawQrCard,
} from "./canvasCore";

export interface DrawSlideAssets {
  coinImg: HTMLImageElement;
  logoImg: HTMLImageElement;
  qrImg?: HTMLImageElement;
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

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = tokens.black;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawFaintGlow(ctx, tokens.gold);
  drawHairlineFrame(ctx, tokens.goldBorder);

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
