import Link from "next/link";

export function AppHeader({ title, backHref }: { title: string; backHref?: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2.5 border-b border-[var(--gold-border)] bg-black/95 px-4 py-3.5 backdrop-blur">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Back"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--card)] text-gold-light"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-[15px] w-[15px]">
            <path d="M14 5l-7 7 7 7" />
          </svg>
        </Link>
      ) : (
        <span className="w-7" />
      )}
      <h1 className="flex-1 text-[15.5px] font-bold text-white">{title}</h1>
    </header>
  );
}
