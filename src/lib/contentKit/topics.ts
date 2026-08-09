export interface SlideContent {
  eyebrow: string;
  headline: string;
  /** The exact substring of `headline` to render with the gold gradient. Must appear verbatim in `headline`. */
  keyPhrase: string;
  /** Bullets for content slides, or a single sub-line for the cover/CTA. */
  body: string[];
}

export interface Topic {
  slug: string;
  handle: string;
  slides: [SlideContent, SlideContent, SlideContent, SlideContent];
}

export const AXISPRESTIGE_TOPIC: Topic = {
  slug: "axisprestige",
  handle: "@alphasaxis",
  slides: [
    {
      eyebrow: "Founding Membership",
      headline: "Own a piece of AlphasAxis from day one.",
      keyPhrase: "AlphasAxis",
      body: ["AxisPrestige — the founding node of the AlphasAxis ecosystem."],
    },
    {
      eyebrow: "The Gap",
      headline: "Most platforms reward users last.",
      keyPhrase: "users last",
      body: [
        "Early builders rarely share in the upside.",
        "Loyalty gets a badge, not a stake.",
        "By the time you can buy in, the best terms are gone.",
      ],
    },
    {
      eyebrow: "What AxisPrestige Is",
      headline: "A founding-tier membership, not a promise.",
      keyPhrase: "founding-tier",
      body: [
        "Access to platform ecosystem rewards.",
        "Distributed quarterly from real platform activity.",
        "5,000 nodes total — once minted, this tier closes.",
      ],
    },
    {
      eyebrow: "Get Started",
      headline: "Scan to explore AxisPrestige.",
      keyPhrase: "AxisPrestige",
      body: ["Educational. Not financial advice."],
    },
  ],
};
