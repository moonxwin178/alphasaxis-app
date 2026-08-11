export const CANVAS_W = 1080;
export const CANVAS_H = 1350;
export const MX = 110;

const FONT_FAMILY = "Visby Canvas";

export interface Tokens {
  black: string;
  gold: string;
  goldLight: string;
  goldDim: string;
  goldBorder: string;
  white: string;
  cream: string;
  dim: string;
}

export function readTokens(): Tokens {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    black: read("--black", "#0F0D0A"),
    gold: read("--gold", "#9E7C45"),
    goldLight: read("--gold-light", "#FFDAA4"),
    goldDim: read("--gold-dim", "#6B5630"),
    goldBorder: "rgba(158,124,69,0.35)",
    white: read("--white", "#FCF8F1"),
    cream: read("--white", "#FCF8F1"),
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

export function font(weight: number, size: number): string {
  return `${weight} ${size}px "${FONT_FAMILY}"`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Word-wrap `text` to `maxWidth` at the given font, returning lines as word arrays. */
export function wrapWords(ctx: CanvasRenderingContext2D, text: string, fontStr: string, maxWidth: number): string[][] {
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

/** Word index range of `keyPhrase` within `flat`, ignoring trailing punctuation. Returns [-1,-1] if not found. */
export function findKeyPhraseRange(flat: string[], keyPhrase: string): [number, number] {
  const stripPunct = (w: string) => w.replace(/[.,!?;:]+$/, "");
  const keyWords = keyPhrase.split(" ").map(stripPunct);
  const flatStripped = flat.map(stripPunct);
  for (let i = 0; i <= flatStripped.length - keyWords.length; i++) {
    if (flatStripped.slice(i, i + keyWords.length).join(" ") === keyWords.join(" ")) {
      return [i, i + keyWords.length - 1];
    }
  }
  return [-1, -1];
}

export interface HeadlineStyle {
  fontWeight: number;
  size: number;
  lineHeight: number;
  inkColor: string;
  gradientC0: string;
  gradientC1: string;
}

/** Draws a wrapped headline where `keyPhrase` is filled with a left->right gradient and the rest in `inkColor`. */
export function drawGradientHeadline(
  ctx: CanvasRenderingContext2D,
  headline: string,
  keyPhrase: string,
  x: number,
  y: number,
  maxWidth: number,
  style: HeadlineStyle
): number {
  const fontStr = font(style.fontWeight, style.size);
  const lines = wrapWords(ctx, headline, fontStr, maxWidth);
  const flat = lines.flat();
  const [keyStart, keyEnd] = findKeyPhraseRange(flat, keyPhrase);

  ctx.font = fontStr;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  let wordIndex = 0;
  let cursorY = y;
  for (const line of lines) {
    let cursorX = x;
    for (let i = 0; i < line.length; i++) {
      const word = line[i];
      const isKey = keyStart !== -1 && wordIndex >= keyStart && wordIndex <= keyEnd;
      const display = word + (i < line.length - 1 ? " " : "");
      const w = ctx.measureText(display).width;
      if (isKey) {
        const grad = ctx.createLinearGradient(cursorX, 0, cursorX + w, 0);
        grad.addColorStop(0, style.gradientC0);
        grad.addColorStop(1, style.gradientC1);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = style.inkColor;
      }
      ctx.fillText(display, cursorX, cursorY);
      cursorX += w;
      wordIndex++;
    }
    cursorY += style.lineHeight;
  }
  return cursorY;
}

export function drawEyebrow(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  lineColor: string,
  textColor: string
): void {
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 44, y);
  ctx.stroke();

  const fontSize = 26;
  ctx.font = font(600, fontSize);
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Matches the real .eyebrow CSS class (globals.css): letter-spacing 0.12em.
  // A literal double-space join looks crude at this weight/size — this
  // replicates true per-character tracking instead.
  const tracking = fontSize * 0.12;
  const ty = y + 42;
  let cursorX = x;
  for (const ch of label.toUpperCase()) {
    ctx.fillText(ch, cursorX, ty);
    cursorX += ctx.measureText(ch).width + tracking;
  }
}

export function drawHairlineFrame(ctx: CanvasRenderingContext2D, borderColor: string): void {
  const inset = 48;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(inset, inset, CANVAS_W - inset * 2, CANVAS_H - inset * 2, 24);
  ctx.stroke();
}

export function drawFaintGlow(ctx: CanvasRenderingContext2D, color: string, alpha = 0.1): void {
  const grad = ctx.createRadialGradient(260, 260, 0, 260, 260, 620);
  grad.addColorStop(0, hexToRgba(color, alpha));
  grad.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

export function drawHeroCoin(
  ctx: CanvasRenderingContext2D,
  coinImg: HTMLImageElement,
  haloColorHex: string,
  haloAlpha = 0.32
): void {
  const cx = 780;
  const cy = 950;
  const size = 352;
  const R = Math.round(size * 0.95);

  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  halo.addColorStop(0, hexToRgba(haloColorHex, haloAlpha));
  halo.addColorStop(1, hexToRgba(haloColorHex, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(coinImg, cx - size / 2, cy - size / 2, size, size);
}

export function drawFooter(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  slideIndex: number,
  handle: string,
  textColor: string
): void {
  const y = CANVAS_H - 96;
  const logoW = 190;
  const logoH = logoW * (logoImg.naturalHeight / logoImg.naturalWidth);
  ctx.drawImage(logoImg, MX, y - logoH / 2, logoW, logoH);

  ctx.font = font(400, 24);
  ctx.fillStyle = textColor;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const index = `${String(slideIndex + 1).padStart(2, "0")}/04`;
  ctx.fillText(`${index}   ${handle}`, CANVAS_W - MX, y);
}

export interface BulletStyle {
  markerColor: string;
  textColor: string;
  marker?: "dot" | "tick";
}

export function drawBullets(
  ctx: CanvasRenderingContext2D,
  bullets: string[],
  x: number,
  y: number,
  maxWidth: number,
  style: BulletStyle
): void {
  const fontStr = font(400, 32);
  const lineHeight = 46;
  const rowGap = 22;
  let cursorY = y;

  for (const bullet of bullets) {
    ctx.fillStyle = style.markerColor;
    if (style.marker === "tick") {
      ctx.strokeStyle = style.markerColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x - 2, cursorY - 12);
      ctx.lineTo(x + 5, cursorY - 5);
      ctx.lineTo(x + 16, cursorY - 20);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x + 6, cursorY - 12, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    const lines = wrapWords(ctx, bullet, fontStr, maxWidth - 36);
    ctx.font = fontStr;
    ctx.fillStyle = style.textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    for (const line of lines) {
      ctx.fillText(line.join(" "), x + 36, cursorY);
      cursorY += lineHeight;
    }
    cursorY += rowGap;
  }
}

/** Single wrapped sub-line block, used for cover/CTA slides. Returns the bottom y. */
export function drawSubLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  color: string
): number {
  const fontStr = font(400, 32);
  const lines = wrapWords(ctx, text, fontStr, maxWidth);
  ctx.font = fontStr;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let sy = y;
  for (const line of lines) {
    ctx.fillText(line.join(" "), x, sy);
    sy += 44;
  }
  return sy;
}

export function drawQrCard(
  ctx: CanvasRenderingContext2D,
  qrImg: HTMLImageElement,
  borderColor: string,
  labelColor: string
): void {
  const cardW = 420;
  const cardH = 420;
  const cardX = (CANVAS_W - cardW) / 2;
  const cardY = 760;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 20);
  ctx.stroke();

  const qrSize = 260;
  ctx.drawImage(qrImg, cardX + (cardW - qrSize) / 2, cardY + 34, qrSize, qrSize);

  ctx.font = font(600, 22);
  ctx.fillStyle = labelColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("SCAN TO GET STARTED", CANVAS_W / 2, cardY + qrSize + 70);
}
