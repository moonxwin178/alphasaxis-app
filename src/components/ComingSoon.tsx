import { AppHeader } from "@/components/AppHeader";

export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div>
      <AppHeader title={title} />
      <div className="px-4 pt-4">
        <div className="card" style={{ borderColor: "rgba(158,124,69,.4)" }}>
          <p className="row-title mb-1">Coming in Phase B</p>
          <p className="row-sub">{note}</p>
        </div>
      </div>
    </div>
  );
}
