import type { SlideContent } from "./topics";

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;
export const MX = 110;

const FONT_FAMILY = "Visby Canvas";

export interface Tokens {
  black: string;
  gold: string;
  goldLight: string;
  goldBorder: string;
  white: string;
  dim: string;
}

export function readTokens(): Tokens {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    black: read("--black", "#0F0D0A"),
    gold: read("--gold", "#9E7C45"),
    goldLight: read("--gold-light", "#FFDAA4"),
    goldBorder: "rgba(158,124,69,0.35)",
    white: read("--white", "#FCF8F1"),
    dim: "rgba(252,248,241,0.62)",
  };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function loadFonts(): Promise<void> {
  await Promise.all([
    document.fonts.load(`300 76px "${FONT_FAMILY}"`),
    document.fonts.load(`400 32px "${FONT_FAMILY}"`),
    document.fonts.load(`600 28px "${FONT_FAMILY}"`),
  ]);
}

function font(weight: number, size: number): string {
  return `${weight} ${size}px "${FONT_FAMILY}"`;
}

/** Word-wrap `text` to `maxWidth` at the given font, returning lines as word arrays. */
function wrapWords(ctx: CanvasRenderingContext2D, text: string, fontStr: string, maxWidth: number): string[][] {
  ctx.font = fontStr;
  const words = text.split(" ");
  const lines: string[][] = [[]];
  for (const word of words) {
    const current = lines[lines.length - 1];
    const trial = [...current, word].join(" ");
    if (current.length > 0 && ctx.measureText(trial).width > maxWidth) {
      lines.push([word]);
    } else {
      current.push(word);
    }
  }
  return lines;
}

/**
 * Draws a headline where the substring `keyPhrase` (verbatim in `headline`) is
 * filled with a left->right gold gradient and the rest in `inkColor`.
 */
function drawHeadline(
  ctx: CanvasRenderingContext2D,
  headline: string,
  keyPhrase: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  lineHeight: number,
  inkColor: string,
  tokens: Tokens
): number {
  const fontStr = font(300, size);
  const lines = wrapWords(ctx, headline, fontStr, maxWidth);

  // Match words ignoring trailing punctuation (e.g. "last." vs "last") so the
  // key-phrase lookup isn't thrown off by a period at the end of a sentence.
  const stripPunct = (w: string) => w.replace(/[.,!?;:]+$/, "");
  const keyWords = keyPhrase.split(" ").map(stripPunct);
  const flat = lines.flat();
  const flatStripped = flat.map(stripPunct);

  let keyStart = -1;
  for (let i = 0; i <= flatStripped.length - keyWords.length; i++) {
    if (flatStripped.slice(i, i + keyWords.length).join(" ") === keyWords.join(" ")) {
      keyStart = i;
      break;
    }
  }
  const keyEnd = keyStart === -1 ? -1 : keyStart + keyWords.length - 1;

  ctx.font = fontStr;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  let wordIndex = 0;
  let cursorY = y;
  for (const line of lines) {
    let cursorX = x;
    for (let i = 0; i < line.length; i++) {
      const word = line[i];
      const isKey = wordIndex >= keyStart && wordIndex <= keyEnd;
      const display = word + (i < line.length - 1 ? " " : "");
      const w = ctx.measureText(display).width;
      if (isKey) {
        const grad = ctx.createLinearGradient(cursorX, 0, cursorX + w, 0);
        grad.addColorStop(0, tokens.goldLight);
        grad.addColorStop(1, tokens.gold);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = inkColor;
      }
      ctx.fillText(display, cursorX, cursorY);
      cursorX += w;
      wordIndex++;
    }
    cursorY += lineHeight;
  }
  return cursorY;
}

function drawEyebrow(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, tokens: Tokens): void {
  ctx.strokeStyle = tokens.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 44, y);
  ctx.stroke();

  ctx.font = font(600, 26);
  ctx.fillStyle = tokens.goldLight;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const spaced = label.toUpperCase().split("").join("  ");
  ctx.fillText(spaced, x, y + 42);
}

function drawHairlineFrame(ctx: CanvasRenderingContext2D, tokens: Tokens): void {
  const inset = 48;
  const r = 24;
  ctx.strokeStyle = tokens.goldBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(inset, inset, CANVAS_W - inset * 2, CANVAS_H - inset * 2, r);
  ctx.stroke();
}

function drawFaintGlow(ctx: CanvasRenderingContext2D, tokens: Tokens): void {
  const grad = ctx.createRadialGradient(260, 260, 0, 260, 260, 620);
  grad.addColorStop(0, hexToRgba(tokens.gold, 0.1));
  grad.addColorStop(1, hexToRgba(tokens.gold, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function drawHeroCoin(ctx: CanvasRenderingContext2D, coinImg: HTMLImageElement, tokens: Tokens): void {
  const cx = 780;
  const cy = 950;
  const size = 352;
  const R = Math.round(size * 0.95);

  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  halo.addColorStop(0, hexToRgba(tokens.gold, 0.32));
  halo.addColorStop(1, hexToRgba(tokens.gold, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(coinImg, cx - size / 2, cy - size / 2, size, size);
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  slideIndex: number,
  handle: string,
  tokens: Tokens
): void {
  const y = CANVAS_H - 96;
  const logoW = 190;
  const logoH = logoW * (logoImg.naturalHeight / logoImg.naturalWidth);
  ctx.drawImage(logoImg, MX, y - logoH / 2, logoW, logoH);

  ctx.font = font(400, 24);
  ctx.fillStyle = tokens.dim;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const index = `${String(slideIndex + 1).padStart(2, "0")}/04`;
  ctx.fillText(`${index}   ${handle}`, CANVAS_W - MX, y);
}

function drawBullets(
  ctx: CanvasRenderingContext2D,
  bullets: string[],
  x: number,
  y: number,
  maxWidth: number,
  tokens: Tokens
): void {
  const fontStr = font(400, 32);
  const lineHeight = 46;
  const rowGap = 22;
  let cursorY = y;

  for (const bullet of bullets) {
    ctx.fillStyle = tokens.gold;
    ctx.beginPath();
    ctx.arc(x + 6, cursorY - 12, 6, 0, Math.PI * 2);
    ctx.fill();

    const lines = wrapWords(ctx, bullet, fontStr, maxWidth - 36);
    ctx.font = fontStr;
    ctx.fillStyle = tokens.dim;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    for (const line of lines) {
      ctx.fillText(line.join(" "), x + 36, cursorY);
      cursorY += lineHeight;
    }
    cursorY += rowGap;
  }
}

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
  assets: DrawSlideAssets
): void {
  const tokens = readTokens();
  const contentWidth = CANVAS_W - MX * 2;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = tokens.black;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawFaintGlow(ctx, tokens);
  drawHairlineFrame(ctx, tokens);

  drawEyebrow(ctx, content.eyebrow, MX, 172, tokens);

  const headlineBottom = drawHeadline(
    ctx,
    content.headline,
    content.keyPhrase,
    MX,
    268,
    contentWidth,
    76,
    82,
    tokens.white,
    tokens
  );

  if (slideIndex === 1 || slideIndex === 2) {
    drawBullets(ctx, content.body, MX, headlineBottom + 50, contentWidth, tokens);
  } else {
    ctx.font = font(400, 32);
    ctx.fillStyle = tokens.dim;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const subLines = wrapWords(ctx, content.body[0], font(400, 32), contentWidth * 0.82);
    let sy = headlineBottom + 44;
    for (const line of subLines) {
      ctx.fillText(line.join(" "), MX, sy);
      sy += 44;
    }
  }

  if (slideIndex === 0) {
    drawHeroCoin(ctx, assets.coinImg, tokens);
  }

  if (slideIndex === 3 && assets.qrImg) {
    const cardW = 420;
    const cardH = 420;
    const cardX = (CANVAS_W - cardW) / 2;
    const cardY = 760;
    ctx.strokeStyle = tokens.goldBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.stroke();

    const qrSize = 260;
    ctx.drawImage(assets.qrImg, cardX + (cardW - qrSize) / 2, cardY + 34, qrSize, qrSize);

    ctx.font = font(600, 22);
    ctx.fillStyle = tokens.goldLight;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("SCAN TO GET STARTED", CANVAS_W / 2, cardY + qrSize + 70);
  }

  drawFooter(ctx, assets.logoImg, slideIndex, handle, tokens);
}
