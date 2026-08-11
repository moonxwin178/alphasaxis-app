import type { SlideContent } from "./topics";
import {
  CANVAS_W,
  CANVAS_H,
  MX,
  type Lang,
  readTokens,
  font,
  wrapWords,
  findKeyPhraseRange,
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

const SIZE = 80;
const LINE_HEIGHT = 90;

/** Headline where the key phrase sits on a solid gold highlight block with black text, rest in white. */
function drawHighlightHeadline(
  ctx: CanvasRenderingContext2D,
  headline: string,
  keyPhrase: string,
  x: number,
  y: number,
  maxWidth: number,
  gold: string,
  black: string,
  white: string,
  lang: Lang
): number {
  const fontStr = font(600, SIZE, lang);
  const lines = wrapWords(ctx, headline, fontStr, maxWidth, lang);
  const flat = lines.flat();
  const [keyStart, keyEnd] = findKeyPhraseRange(flat, keyPhrase, lang);
  const gap = lang === "zh" ? "" : " ";

  ctx.font = fontStr;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Pass 1: lay out words per line, tracking each word's x/width/isKey.
  type Laid = { word: string; x: number; w: number; isKey: boolean };
  const laidLines: Laid[][] = [];
  let wordIndex = 0;
  let cursorY = y;
  for (const line of lines) {
    let cursorX = x;
    const laid: Laid[] = [];
    for (let i = 0; i < line.length; i++) {
      const display = line[i] + (i < line.length - 1 ? gap : "");
      const w = ctx.measureText(display).width;
      const isKey = keyStart !== -1 && wordIndex >= keyStart && wordIndex <= keyEnd;
      laid.push({ word: display, x: cursorX, w, isKey });
      cursorX += w;
      wordIndex++;
    }
    laidLines.push(laid);
    cursorY += LINE_HEIGHT;
  }

  // Pass 2: gold highlight blocks behind consecutive key-word runs, per line.
  let rowY = y;
  for (const laid of laidLines) {
    const keyWords = laid.filter((w) => w.isKey);
    if (keyWords.length > 0) {
      const x0 = keyWords[0].x;
      const x1 = keyWords[keyWords.length - 1].x + keyWords[keyWords.length - 1].w;
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.roundRect(x0 - 8, rowY - SIZE * 0.78, x1 - x0 + 4, SIZE * 0.92, 6);
      ctx.fill();
    }
    rowY += LINE_HEIGHT;
  }

  // Pass 3: text on top.
  rowY = y;
  for (const laid of laidLines) {
    for (const w of laid) {
      ctx.fillStyle = w.isKey ? black : white;
      ctx.fillText(w.word, w.x, rowY);
    }
    rowY += LINE_HEIGHT;
  }

  return rowY;
}

const PILL_TEXT: Record<Lang, { swipe: string; follow: string }> = {
  en: { swipe: "SWIPE >", follow: "FOLLOW" },
  zh: { swipe: "上滑 >", follow: "关注" },
  bm: { swipe: "LELUAR >", follow: "IKUTI" },
};

function drawPill(ctx: CanvasRenderingContext2D, text: string, gold: string, black: string, lang: Lang): void {
  ctx.font = font(600, 22, lang);
  const padX = 20;
  const w = ctx.measureText(text).width + padX * 2;
  const h = 44;
  const x = CANVAS_W - MX - 40 - w;
  const y = 150;
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = black;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 1);
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
  const black = "#1A1206";

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = tokens.black;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawHairlineFrame(ctx, tokens.goldBorder);

  drawEyebrow(ctx, content.eyebrow, MX, 172, tokens.gold, tokens.goldLight, lang);
  drawPill(ctx, slideIndex === 3 ? PILL_TEXT[lang].follow : PILL_TEXT[lang].swipe, tokens.gold, black, lang);

  const headlineBottom = drawHighlightHeadline(
    ctx,
    content.headline,
    content.keyPhrase,
    MX,
    280,
    contentWidth,
    tokens.gold,
    black,
    tokens.white,
    lang
  );

  if (slideIndex === 1 || slideIndex === 2) {
    drawBullets(
      ctx,
      content.body,
      MX,
      headlineBottom + 50,
      contentWidth,
      {
        markerColor: tokens.gold,
        textColor: tokens.dim,
        marker: "tick",
      },
      lang
    );
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
