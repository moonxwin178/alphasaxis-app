import { ogSize, ogContentType, renderOgImage } from "@/lib/ogImage";

export const alt = "AlphasAxis App";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return renderOgImage({
    eyebrow: "AlphasAxis Super App",
    title: "Your Cases, Rewards & Wallet — All On-Chain.",
    subtitle:
      "Track financing cases, earn $AXIS, and manage your founding node — from one app.",
  });
}
