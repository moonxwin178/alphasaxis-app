import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const visby = localFont({
  variable: "--font-visby",
  display: "swap",
  src: [
    { path: "../fonts/Visby-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/Visby-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Visby-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Visby-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/Visby-800.woff2", weight: "800", style: "normal" },
  ],
});

const title = "AlphasAxis App";
const description = "The AlphasAxis Super App — cases, rewards, wallet and more.";

export const metadata: Metadata = {
  title: { default: title, template: "%s — AlphasAxis" },
  description,
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AlphasAxis",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F0D0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${visby.variable} h-full antialiased`}>
      <body className="min-h-full bg-black text-white">{children}</body>
    </html>
  );
}
