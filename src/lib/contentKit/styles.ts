import type { SlideContent } from "./topics";
import type { Lang, Tokens } from "./canvasCore";
import * as prestige from "./prestigeTemplate";
import * as champagne from "./champagneTemplate";
import * as ticker from "./tickerTemplate";
import * as creative from "./creativeTemplate";
import * as viral from "./viralTemplate";

export interface DrawSlideAssets {
  coinImg: HTMLImageElement;
  logoImg: HTMLImageElement;
  qrImg?: HTMLImageElement;
}

export type DrawSlideFn = (
  ctx: CanvasRenderingContext2D,
  slideIndex: number,
  content: SlideContent,
  handle: string,
  lang: Lang,
  assets: DrawSlideAssets
) => void;

/** Decorative-only render (no content) used by the poster editor to seed a background layer. */
export type DrawBackgroundFn = (ctx: CanvasRenderingContext2D, tokens: Tokens, lang: Lang, slideIndex: number) => void;

export interface StyleDef {
  id: string;
  label: string;
  ground: "dark" | "light";
  drawSlide: DrawSlideFn;
  drawBackground: DrawBackgroundFn;
}

export const STYLES: StyleDef[] = [
  { id: "prestige", label: "Prestige", ground: "dark", drawSlide: prestige.drawSlide, drawBackground: prestige.drawBackground },
  { id: "champagne", label: "Champagne", ground: "light", drawSlide: champagne.drawSlide, drawBackground: champagne.drawBackground },
  { id: "ticker", label: "Ticker", ground: "dark", drawSlide: ticker.drawSlide, drawBackground: ticker.drawBackground },
  { id: "creative", label: "Creative", ground: "dark", drawSlide: creative.drawSlide, drawBackground: creative.drawBackground },
  { id: "viral", label: "Viral", ground: "dark", drawSlide: viral.drawSlide, drawBackground: viral.drawBackground },
];
