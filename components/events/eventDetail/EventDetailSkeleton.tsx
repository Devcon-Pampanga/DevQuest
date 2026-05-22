import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";

export function EventDetailPageShellSkeleton() {
  return (
    <PageShell title="Event" loading={true} skeleton={<EventDetailSkeletonInner />}>
      {null}
    </PageShell>
  );
}

export function EventDetailSkeletonInner() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5 pb-10">
      <div className="rounded-2xl border border-border bg-surface p-5 animate-pulse flex flex-col gap-3">
        <SkeletonLine className="w-56" />
        <SkeletonLine className="w-40" />
        <SkeletonLine className="w-32" />
        <SkeletonBlock className="h-10 w-32 rounded-xl" />
      </div>
      <SkeletonLine className="w-20" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-4 animate-pulse flex items-center justify-between"
        >
          <SkeletonLine className="w-28" />
          <SkeletonBlock className="h-8 w-20 rounded-lg" />
        </div>
      ))}
      <div className="rounded-2xl border border-border bg-surface p-5 animate-pulse flex flex-col gap-2">
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-3/4" />
      </div>
    </div>
  );
}

