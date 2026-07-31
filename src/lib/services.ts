export interface ServiceDef {
  slug: string;
  title: string;
  sub: string;
  description: string;
  pointsCost: number;
  fulfillment: string;
}

// Placeholder pricing — swap for real rates once ops confirms them.
export const SERVICES: ServiceDef[] = [
  {
    slug: "legal-document-prep",
    title: "Legal document preparation",
    sub: "Per case",
    description: "Loan and property paperwork drafted and checked by our legal team.",
    pointsCost: 800,
    fulfillment: "A specialist starts on your documents within 2 business days.",
  },
  {
    slug: "property-valuation",
    title: "Property valuation report",
    sub: "Certified valuer",
    description: "A certified valuer visits and produces a bank-acceptable valuation report.",
    pointsCost: 1200,
    fulfillment: "Our panel valuer will contact you within 2 business days to schedule a visit.",
  },
  {
    slug: "credit-report-pull",
    title: "Credit report pull",
    sub: "CCRIS + CTOS",
    description:
      "A combined CCRIS + CTOS credit report, pulled and reviewed by our team so you know exactly where you stand before applying.",
    pointsCost: 150,
    fulfillment:
      "This is processed manually by a specialist, not an instant automated pull — expect your report within 1–2 business days.",
  },
  {
    slug: "insurance-bundling",
    title: "Insurance bundling",
    sub: "MRTA / fire insurance",
    description: "Bundle MRTA and fire insurance into your financing at preferred rates.",
    pointsCost: 500,
    fulfillment: "Our insurance partner will reach out within 2 business days with your quote.",
  },
];

export function getService(slug: string): ServiceDef | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
