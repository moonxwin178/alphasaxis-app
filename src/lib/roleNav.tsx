import type { ReactNode } from "react";

export interface TabDef {
  href: string;
  label: string;
  icon: ReactNode;
}

const ICON_STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

const icons = {
  cases: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M3 7h18v12H3z" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  coins: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="15" cy="15.5" r="5.5" />
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M4 8l1.5-4h13L20 8" />
      <path d="M4 8h16v11H4z" />
      <path d="M9 12a3 3 0 0 0 6 0" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <circle cx="12" cy="8" r="3.7" />
      <path d="M4.5 20c1.4-4 5-6 7.5-6s6.1 2 7.5 6" />
    </svg>
  ),
  pipeline: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <circle cx="9" cy="8" r="3.3" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M2.5 20c1.2-3.6 4-5.5 6.5-5.5s5.3 1.9 6.5 5.5M15 14.7c2 .2 4 1.7 4.8 4" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M8 4h8v6a4 4 0 0 1-8 0z" />
      <path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M10 18h4M12 14v4M8 21h8" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M4 12l6 6L20 6" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M12 3L2 20h20z" />
      <path d="M12 9v5M12 17v.3" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" {...ICON_STROKE}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
};

export const USER_TABS: TabDef[] = [
  { href: "/cases", label: "Cases", icon: icons.cases },
  { href: "/earn", label: "Earn", icon: icons.coins },
  { href: "/market", label: "Market", icon: icons.shop },
  { href: "/wallet", label: "Wallet", icon: icons.wallet },
  { href: "/content-kit", label: "Kit", icon: icons.grid },
  { href: "/profile", label: "Profile", icon: icons.user },
];

export const AGENT_TABS: TabDef[] = [
  { href: "/agent/pipeline", label: "Pipeline", icon: icons.pipeline },
  { href: "/agent/docs", label: "Docs", icon: icons.doc },
  { href: "/agent/earn", label: "Earn", icon: icons.coins },
  { href: "/agent/score", label: "Score", icon: icons.chart },
  { href: "/content-kit", label: "Kit", icon: icons.grid },
];

export const AGENCY_TABS: TabDef[] = [
  { href: "/agency/agents", label: "Agents", icon: icons.users },
  { href: "/agency/revenue", label: "Revenue", icon: icons.chart },
  { href: "/agency/rankings", label: "Rankings", icon: icons.trophy },
  { href: "/agency/nft", label: "NFT", icon: icons.shield },
];

export const CONSULTANT_TABS: TabDef[] = [
  { href: "/consultant/pipeline", label: "Pipeline", icon: icons.pipeline },
  { href: "/content-kit", label: "Kit", icon: icons.grid },
  { href: "/consultant/profile", label: "Profile", icon: icons.user },
];

export const ADMIN_TABS: TabDef[] = [
  { href: "/admin/users", label: "Users", icon: icons.check },
  { href: "/admin/cases", label: "Cases", icon: icons.cases },
  { href: "/admin/payouts", label: "Payouts", icon: icons.coins },
  { href: "/admin/disputes", label: "Disputes", icon: icons.alert },
  { href: "/admin/analytics", label: "Analytics", icon: icons.chart },
];
