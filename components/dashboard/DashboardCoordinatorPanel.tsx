import Link from "next/link";

export function DashboardCoordinatorPanel({
  approvalsCount,
  chapterVolunteersActive,
  eventsThisMonthCount,
}: {
  approvalsCount: number;
  chapterVolunteersActive: number | null;
  eventsThisMonthCount: number;
}) {
  return (
    <div
      className="order-4 lg:order-none rounded-2xl bg-surface border border-border p-5 flex flex-col gap-3 animate-fade-up"
      style={{ animationDelay: "0ms" }}
    >
      <h2 className="font-heading text-sm text-text-primary uppercase tracking-widest">Coordinator</h2>
      <Link
        href="/quests?tab=approvals"
        className="rounded-2xl border p-4 hover:border-accent-primary/60 transition-colors"
        style={{
          borderColor: approvalsCount > 0 ? "#A855F755" : "#27272A",
          backgroundColor: approvalsCount > 0 ? "#A855F708" : "#16213e",
        }}
      >
        <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Pending approvals</p>
        <p
          className="font-heading text-2xl text-accent-highlight tabular-nums"
          style={approvalsCount > 0 ? { animation: "count-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) 700ms 3" } : undefined}
        >
          {approvalsCount}
        </p>
        <p className="text-xs text-text-muted font-sans mt-1.5">Awaiting review</p>
      </Link>
      <Link
        href="/events/new"
        className="rounded-2xl p-4 flex flex-col justify-between transition-colors hover:bg-accent-highlight/20"
        style={{ backgroundColor: "#A855F714", border: "1px solid #A855F730" }}
      >
        <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Quick action</p>
        <p className="font-heading text-lg text-text-primary">Add Event</p>
        <p className="text-xs font-sans mt-1.5" style={{ color: "#A855F7" }}>
          Create new →
        </p>
      </Link>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-elevated p-3">
          <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-1.5">Active</p>
          <p className="font-heading text-xl text-text-primary tabular-nums">
            {chapterVolunteersActive === null ? "—" : chapterVolunteersActive}
          </p>
          <p className="text-[10px] text-text-muted font-sans mt-0.5">volunteers</p>
        </div>
        <div className="rounded-2xl border border-border bg-elevated p-3">
          <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-1.5">This month</p>
          <p className="font-heading text-xl text-text-primary tabular-nums">{eventsThisMonthCount}</p>
          <p className="text-[10px] text-text-muted font-sans mt-0.5">events</p>
        </div>
      </div>
    </div>
  );
}
