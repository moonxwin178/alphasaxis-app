export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col sm:border-x sm:border-[var(--gold-border)]">
      {children}
    </div>
  );
}
