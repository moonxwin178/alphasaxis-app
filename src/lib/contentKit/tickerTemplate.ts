import type { SlideContent } from "./topics";
import {
  CANVAS_W,
  CANVAS_H,
  MX,
  type Lang,
  readTokens,
  hexToRgba,
  drawGradientHeadline,
  drawEyebrow,
  drawHairlineFrame,
  drawFaintGlow,
  drawHeroCoin,
  drawBullets,
  drawSubLines,
  drawQrCard,
} from "./canvasCore";

export interface DrawSlideAssets {
  coinImg: HTMLImageElement;
  logoImg: HTMLImageElement;
  qrImg?: HTMLImageElement;
}

const MONO = '"SFMono-Regular", Consolas, monospace';
const CJK_MONO = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

const TICKER_UNIT: Record<Lang, string> = {
  en: "$AXIS  ·  EDUCATIONAL CONTENT  ·  ",
  zh: "$AXIS  ·  教育内容  ·  ",
  bm: "$AXIS  ·  KANDUNGAN PENDIDIKAN  ·  ",
};

function drawTickerStrip(ctx: CanvasRenderingContext2D, goldLight: string, goldBorder: string, lang: Lang): void {
  const y = 90;
  ctx.strokeStyle = goldBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MX, y - 20);
  ctx.lineTo(CANVAS_W - MX, y - 20);
  ctx.moveTo(MX, y + 12);
  ctx.lineTo(CANVAS_W - MX, y + 12);
  ctx.stroke();

  ctx.font = lang === "zh" ? `12px ${CJK_MONO}` : `12px ${MONO}`;
  ctx.fillStyle = goldLight;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const unit = TICKER_UNIT[lang];
  const unitWidth = ctx.measureText(unit).width;
  const repeats = Math.ceil((CANVAS_W - MX * 2) / unitWidth) + 1;
  ctx.save();
  ctx.beginPath();
  ctx.rect(MX, y - 20, CANVAS_W - MX * 2, 32);
  ctx.clip();
  ctx.fillText(unit.repeat(repeats), MX, y);
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.strokeStyle = hexToRgba(color, 0.05);
  ctx.lineWidth = 1;
  for (let x = MX; x <= CANVAS_W - MX; x += 108) {
    ctx.beginPath();
    ctx.moveTo(x, 140);
    ctx.lineTo(x, CANVAS_H - 140);
    ctx.stroke();
  }
  for (let y = 140; y <= CANVAS_H - 140; y += 108) {
    ctx.beginPath();
    ctx.moveTo(MX, y);
    ctx.lineTo(CANVAS_W - MX, y);
    ctx.stroke();
  }
}

function drawRisingChart(ctx: CanvasRenderingContext2D, color: string): void {
  const points: [number, number][] = [
    [MX, 1060],
    [320, 1010],
    [520, 1030],
    [700, 940],
    [860, 880],
    [CANVAS_W - MX, 800],
  ];
  ctx.strokeStyle = hexToRgba(color, 0.28);
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();

  const [lastX, lastY] = points[points.length - 1];
  ctx.fillStyle = hexToRgba(color, 0.9);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
  ctx.fill();
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
  drawFaintGlow(ctx, tokens.gold, 0.07);
  drawGrid(ctx, tokens.gold);
  drawHairlineFrame(ctx, tokens.goldBorder);
  drawTickerStrip(ctx, tokens.goldLight, tokens.goldBorder, lang);
  drawRisingChart(ctx, tokens.gold);

  drawEyebrow(ctx, content.eyebrow, MX, 220, tokens.gold, tokens.goldLight, lang);

  const headlineBottom = drawGradientHeadline(
    ctx,
    content.headline,
    content.keyPhrase,
    MX,
    316,
    contentWidth,
    {
      fontWeight: 300,
      size: 72,
      lineHeight: 78,
      inkColor: tokens.white,
      gradientC0: tokens.goldLight,
      gradientC1: tokens.gold,
    },
    lang
  );

  if (slideIndex === 1 || slideIndex === 2) {
    drawBullets(ctx, content.body, MX, headlineBottom + 46, contentWidth, { markerColor: tokens.gold, textColor: tokens.dim }, lang);
  } else {
    drawSubLines(ctx, content.body[0], MX, headlineBottom + 40, contentWidth * 0.82, tokens.dim, lang);
  }

  if (slideIndex === 0) {
    drawHeroCoin(ctx, assets.coinImg, tokens.gold);
  }

  if (slideIndex === 3 && assets.qrImg) {
    drawQrCard(ctx, assets.qrImg, tokens.goldBorder, tokens.goldLight, lang);
  }

  // Footer with a monospace index, per the style's signature.
  const y = CANVAS_H - 96;
  const logoW = 190;
  const logoH = logoW * (assets.logoImg.naturalHeight / assets.logoImg.naturalWidth);
  ctx.drawImage(assets.logoImg, MX, y - logoH / 2, logoW, logoH);
  ctx.font = `13px ${MONO}`;
  ctx.fillStyle = tokens.dim;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const index = `${String(slideIndex + 1).padStart(2, "0")}/04`;
  ctx.fillText(`${index}   ${handle}`, CANVAS_W - MX, y);
}
