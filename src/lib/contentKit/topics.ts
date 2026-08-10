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
  label: string;
  handle: string;
  slides: [SlideContent, SlideContent, SlideContent, SlideContent];
}

export const AXISPRESTIGE_TOPIC: Topic = {
  slug: "axisprestige",
  label: "AxisPrestige",
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

export const AXIS_TOKEN_TOPIC: Topic = {
  slug: "axis-token",
  label: "$AXIS Token",
  handle: "@alphasaxis",
  slides: [
    {
      eyebrow: "The Utility Token",
      headline: "Real revenue backs the $AXIS token.",
      keyPhrase: "$AXIS token",
      body: ["Not a speculative coin — a utility token tied to an actual brokerage business."],
    },
    {
      eyebrow: "The Problem With Most Tokens",
      headline: "Most tokens launch before there's a business.",
      keyPhrase: "before there's a business",
      body: [
        "Price charts with nothing behind them.",
        "Utility promised, rarely delivered.",
        "Value dependent entirely on new buyers.",
      ],
    },
    {
      eyebrow: "What $AXIS Is",
      headline: "A utility token for a real ecosystem.",
      keyPhrase: "real ecosystem",
      body: [
        "Powers rewards across the AlphasAxis platform.",
        "Earned through real activity — cases, referrals, engagement.",
        "Backed by an operating brokerage business.",
      ],
    },
    {
      eyebrow: "Learn More",
      headline: "Scan to understand $AXIS.",
      keyPhrase: "$AXIS",
      body: ["Educational. Not financial advice."],
    },
  ],
};

export const MEMBERSHIP_TOPIC: Topic = {
  slug: "membership",
  label: "Membership Tiers",
  handle: "@alphasaxis",
  slides: [
    {
      eyebrow: "Membership Tiers",
      headline: "Four tiers. One growing ecosystem.",
      keyPhrase: "One growing ecosystem",
      body: ["AxisZero to AxisPrestige — access that scales with your involvement."],
    },
    {
      eyebrow: "One Size Doesn't Fit All",
      headline: "Most platforms treat everyone the same.",
      keyPhrase: "treat everyone the same",
      body: [
        "New members and power users get identical access.",
        "No path to grow your standing over time.",
        "Engagement isn't recognized or rewarded.",
      ],
    },
    {
      eyebrow: "How Tiers Work",
      headline: "Four tiers, each unlocking more.",
      keyPhrase: "each unlocking more",
      body: [
        "AxisZero, AxisOne, AxisPro, AxisPrestige.",
        "Higher tiers unlock deeper ecosystem access.",
        "Your tier reflects your involvement in the platform.",
      ],
    },
    {
      eyebrow: "Find Your Tier",
      headline: "Scan to see where you fit.",
      keyPhrase: "where you fit",
      body: ["Educational. Not financial advice."],
    },
  ],
};

export const EARN_TOPIC: Topic = {
  slug: "earn",
  label: "Earn Tasks",
  handle: "@alphasaxis",
  slides: [
    {
      eyebrow: "Earn On AlphasAxis",
      headline: "Turn 5 minutes into real rewards.",
      keyPhrase: "real rewards",
      body: ["Spend, submit, refer, share — every action earns you points on AlphasAxis."],
    },
    {
      eyebrow: "Most Apps Give You Nothing",
      headline: "Most apps take your time for free.",
      keyPhrase: "for free",
      body: [
        "Scrolling, sharing, referring — normally unpaid.",
        "Your attention has value. Most platforms just keep it.",
        "AlphasAxis pays you back for showing up.",
      ],
    },
    {
      eyebrow: "Four Ways To Earn",
      headline: "Four simple ways to start earning.",
      keyPhrase: "start earning",
      body: [
        "Spend-to-Earn — upload receipts from partner brands.",
        "Submit-to-Earn — complete simple case milestones.",
        "Network & Social — invite friends, follow, engage.",
      ],
    },
    {
      eyebrow: "Start Today",
      headline: "Scan and start earning now.",
      keyPhrase: "earning now",
      body: ["Educational. Not financial advice."],
    },
  ],
};

export const TOPICS: Topic[] = [AXISPRESTIGE_TOPIC, AXIS_TOKEN_TOPIC, MEMBERSHIP_TOPIC, EARN_TOPIC];
