import { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";

export function EventsPageSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5 pb-10">
      <div className="flex gap-2 items-center">
        <SkeletonBlock className="h-10 flex-1 rounded-xl" />
        <SkeletonBlock className="h-10 w-24 rounded-xl shrink-0" />
      </div>

      <div className="flex items-center gap-3">
        <SkeletonLine className="w-20" />
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] overflow-hidden flex flex-col animate-pulse"
          >
            <SkeletonBlock className="h-36 w-full rounded-none" />
            <div className="p-5 flex flex-col gap-3 flex-1">
              <SkeletonLine className="w-4/5" />
              <SkeletonLine className="w-1/2" />
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-3.5 w-3.5 rounded-sm shrink-0" />
                <SkeletonLine className="w-28" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-3.5 w-3.5 rounded-sm shrink-0" />
                <SkeletonLine className="w-36" />
              </div>
              <div className="mt-auto pt-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <SkeletonLine className="w-20" />
                  <SkeletonLine className="w-12" />
                </div>
                <SkeletonBlock className="h-1.5 w-full rounded-full" />
                <SkeletonLine className="w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-2">
        <SkeletonLine className="w-12" />
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#1a1a2e] border border-[#27272A] animate-pulse opacity-60"
          >
            <div className="shrink-0 w-9 flex flex-col gap-1 items-center">
              <SkeletonLine className="w-6" />
              <SkeletonBlock className="h-5 w-8 rounded" />
            </div>
            <div className="w-px h-8 bg-border shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <SkeletonLine className="w-3/5" />
              <SkeletonLine className="w-2/5" />
            </div>
            <SkeletonLine className="w-24 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
