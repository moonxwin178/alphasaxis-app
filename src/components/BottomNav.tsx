"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TabDef } from "@/lib/roleNav";

export function BottomNav({ tabs }: { tabs: TabDef[] }) {
  const pathname = usePathname();

  return (
    <nav className="bottomnav" aria-label="Primary">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link key={tab.href} href={tab.href} className={active ? "active" : ""}>
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
