export interface Caption {
  id: string;
  /** Contains the literal token `{LINK}`, replaced with the user's referral link at render time. */
  text: string;
}

export interface CaptionCategory {
  id: string;
  label: string;
  captions: Caption[];
}

/** Keyed by topic slug (matches `Topic.slug` in topics.ts) so a new topic is a data addition, not a redesign. */
export const CAPTION_BANK: Record<string, CaptionCategory[]> = {
  axisprestige: [
    {
      id: "brand",
      label: "Brand",
      captions: [
        { id: "b1", text: "AlphasAxis is turning Malaysia's loan brokerage industry into on-chain infrastructure — and AxisPrestige is how you own a piece of it from day one. {LINK}" },
        { id: "b2", text: "Most platforms are built, then opened to the public. AxisPrestige flips that — you're in before the doors do. {LINK}" },
        { id: "b3", text: "AlphasAxis: real revenue, on-chain. AxisPrestige is the founding membership behind it. {LINK}" },
        { id: "b4", text: "Building something in Web3 usually means chasing hype. AxisPrestige is backed by an actual brokerage business. {LINK}" },
        { id: "b5", text: "This is what it looks like when a real industry meets real infrastructure. Meet AxisPrestige. {LINK}" },
      ],
    },
    {
      id: "problem",
      label: "The Gap",
      captions: [
        { id: "p1", text: "Most platforms reward users last. Early builders rarely get a real stake in what they helped grow. {LINK}" },
        { id: "p2", text: "Loyalty usually gets you a badge. AxisPrestige is built to give you something more concrete. {LINK}" },
        { id: "p3", text: "By the time most people can buy in, the best terms are already gone. Not this time. {LINK}" },
        { id: "p4", text: "Malaysia's loan industry runs on WhatsApp and spreadsheets. We think that's a solvable problem — and an opportunity. {LINK}" },
        { id: "p5", text: "There's a gap between the people who build a platform and the people who benefit from it. AxisPrestige closes it. {LINK}" },
      ],
    },
    {
      id: "how-it-works",
      label: "How It Works",
      captions: [
        { id: "h1", text: "AxisPrestige nodes: 5,000 total, minted once. Ecosystem rewards distributed quarterly from real platform activity. {LINK}" },
        { id: "h2", text: "No presale hype, no vague promises — just a capped founding tier tied to how the platform actually performs. {LINK}" },
        { id: "h3", text: "Once all 5,000 AxisPrestige nodes are minted, this tier closes for good. {LINK}" },
        { id: "h4", text: "Quarterly distributions. A hard cap. A real business behind it. That's AxisPrestige in three lines. {LINK}" },
        { id: "h5", text: "AxisPrestige ties your membership to the platform's real activity — not a promise, a mechanism. {LINK}" },
      ],
    },
    {
      id: "cta",
      label: "Get Started",
      captions: [
        { id: "c1", text: "Curious where you'd fit in? Scan or tap to see AxisPrestige for yourself. {LINK}" },
        { id: "c2", text: "Ready to see what founding membership actually looks like? Start here. {LINK}" },
        { id: "c3", text: "AxisPrestige, explained in under two minutes. Link below. {LINK}" },
        { id: "c4", text: "Not financial advice — just an invitation to look at the details yourself. {LINK}" },
      ],
    },
  ],
};
