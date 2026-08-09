import type { SlideContent } from "./topics";
import {
  CANVAS_W,
  CANVAS_H,
  MX,
  readTokens,
  drawGradientHeadline,
  drawEyebrow,
  drawHairlineFrame,
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

const INK = "#241505";
const BRONZE_C0 = "#B08442";
const BRONZE_C1 = "#6E5228";
const INK_DIM = "rgba(36,21,5,0.6)";
const BORDER = "rgba(107,86,48,0.32)";

export function drawSlide(
  ctx: CanvasRenderingContext2D,
  slideIndex: number,
  content: SlideContent,
  handle: string,
  assets: DrawSlideAssets
): void {
  const tokens = readTokens();
  const contentWidth = CANVAS_W - MX * 2;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = tokens.cream;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawHairlineFrame(ctx, BORDER);

  drawEyebrow(ctx, content.eyebrow, MX, 172, tokens.goldDim, tokens.goldDim);

  const headlineBottom = drawGradientHeadline(ctx, content.headline, content.keyPhrase, MX, 268, contentWidth, {
    fontWeight: 300,
    size: 76,
    lineHeight: 82,
    inkColor: INK,
    gradientC0: BRONZE_C0,
    gradientC1: BRONZE_C1,
  });

  if (slideIndex === 1 || slideIndex === 2) {
    drawBullets(ctx, content.body, MX, headlineBottom + 50, contentWidth, { markerColor: tokens.goldDim, textColor: INK_DIM });
  } else {
    drawSubLines(ctx, content.body[0], MX, headlineBottom + 44, contentWidth * 0.82, INK_DIM);
  }

  if (slideIndex === 0) {
    drawHeroCoin(ctx, assets.coinImg, tokens.goldLight, 0.45);
  }

  if (slideIndex === 3 && assets.qrImg) {
    drawQrCard(ctx, assets.qrImg, BORDER, tokens.goldDim);
  }

  drawFooter(ctx, assets.logoImg, slideIndex, handle, INK_DIM);
}
