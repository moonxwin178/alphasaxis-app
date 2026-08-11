import type { SlideContent } from "./topics";
import type { Lang } from "./canvasCore";
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

export interface StyleDef {
  id: string;
  label: string;
  ground: "dark" | "light";
  drawSlide: DrawSlideFn;
}

export const STYLES: StyleDef[] = [
  { id: "prestige", label: "Prestige", ground: "dark", drawSlide: prestige.drawSlide },
  { id: "champagne", label: "Champagne", ground: "light", drawSlide: champagne.drawSlide },
  { id: "ticker", label: "Ticker", ground: "dark", drawSlide: ticker.drawSlide },
  { id: "creative", label: "Creative", ground: "dark", drawSlide: creative.drawSlide },
  { id: "viral", label: "Viral", ground: "dark", drawSlide: viral.drawSlide },
];
