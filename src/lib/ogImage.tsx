import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export async function renderOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const [logoData, visbyLight, visbyBold] = await Promise.all([
    readFile(join(process.cwd(), "public/logo.png")),
    readFile(join(process.cwd(), "src/fonts/Visby-300.ttf")),
    readFile(join(process.cwd(), "src/fonts/Visby-600.ttf")),
  ]);
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#0F0D0A",
          backgroundImage:
            "radial-gradient(ellipse 60% 60% at 75% 15%, rgba(158,124,69,0.35), transparent 60%)",
          fontFamily: "Visby",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={280} height={33} alt="AlphasAxis" />

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 960 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#FFDAA4",
              marginBottom: 20,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 60,
              fontWeight: 600,
              lineHeight: 1.12,
              letterSpacing: -1,
              color: "#FCF8F1",
              marginBottom: 26,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 300,
              lineHeight: 1.5,
              color: "rgba(252,248,241,0.6)",
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 1,
            color: "#9E7C45",
          }}
        >
          app.alphasaxis.com
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Visby", data: visbyLight, weight: 300, style: "normal" },
        { name: "Visby", data: visbyBold, weight: 600, style: "normal" },
      ],
    }
  );
}
