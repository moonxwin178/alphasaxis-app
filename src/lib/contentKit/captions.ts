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
  "axis-token": [
    {
      id: "brand",
      label: "Brand",
      captions: [
        { id: "b1", text: "$AXIS isn't another speculative token — it's tied to a real, operating brokerage business. {LINK}" },
        { id: "b2", text: "Most tokens ask you to believe in a whitepaper. $AXIS is backed by real revenue. {LINK}" },
        { id: "b3", text: "Utility first, hype never. That's the idea behind $AXIS. {LINK}" },
      ],
    },
    {
      id: "problem",
      label: "The Gap",
      captions: [
        { id: "p1", text: "Most tokens launch before there's a real business behind them. $AXIS didn't. {LINK}" },
        { id: "p2", text: "Price charts with nothing behind them — that's the story of most tokens. Not this one. {LINK}" },
        { id: "p3", text: "If a token's value depends entirely on new buyers, that's not a business — it's a queue. {LINK}" },
      ],
    },
    {
      id: "how-it-works",
      label: "How It Works",
      captions: [
        { id: "h1", text: "$AXIS powers rewards across the AlphasAxis platform — earned through real activity, not speculation. {LINK}" },
        { id: "h2", text: "Referrals, case progress, engagement — all of it can earn you $AXIS. {LINK}" },
        { id: "h3", text: "$AXIS is backed by an operating brokerage business, not a promise. {LINK}" },
      ],
    },
    {
      id: "cta",
      label: "Get Started",
      captions: [
        { id: "c1", text: "Want to understand how $AXIS actually works? Start here. {LINK}" },
        { id: "c2", text: "No hype, just mechanics. Learn what $AXIS is built on. {LINK}" },
        { id: "c3", text: "Not financial advice — just the facts on $AXIS. {LINK}" },
      ],
    },
  ],
  membership: [
    {
      id: "brand",
      label: "Brand",
      captions: [
        { id: "b1", text: "Four tiers. One growing ecosystem. Find out where you fit at AlphasAxis. {LINK}" },
        { id: "b2", text: "AxisZero to AxisPrestige — membership that scales with your involvement. {LINK}" },
        { id: "b3", text: "Not every member gets treated the same at AlphasAxis. Here's why that's a good thing. {LINK}" },
      ],
    },
    {
      id: "problem",
      label: "The Gap",
      captions: [
        { id: "p1", text: "Most platforms treat every user the same, no matter how involved they are. {LINK}" },
        { id: "p2", text: "New members and power users getting identical access? That never made sense to us. {LINK}" },
        { id: "p3", text: "Engagement usually goes unrecognized. AlphasAxis's tier system changes that. {LINK}" },
      ],
    },
    {
      id: "how-it-works",
      label: "How It Works",
      captions: [
        { id: "h1", text: "AxisZero, AxisOne, AxisPro, AxisPrestige — four tiers, each unlocking more. {LINK}" },
        { id: "h2", text: "Higher tiers mean deeper access to the AlphasAxis ecosystem. {LINK}" },
        { id: "h3", text: "Your tier reflects your involvement in the platform, not just a signup date. {LINK}" },
      ],
    },
    {
      id: "cta",
      label: "Get Started",
      captions: [
        { id: "c1", text: "Curious which tier fits you? Take a look. {LINK}" },
        { id: "c2", text: "See the full tier breakdown and find your fit. {LINK}" },
        { id: "c3", text: "Not financial advice — just an overview of how membership works. {LINK}" },
      ],
    },
  ],
};
