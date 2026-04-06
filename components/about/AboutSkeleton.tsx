import { SkeletonBlock, SkeletonLine } from "@/components/layout/PageShell";

export function AboutSkeleton() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5 pb-10">

      {/* What is DevQuest */}
      <div className="rounded-2xl border border-border overflow-hidden" style={{ backgroundColor: "#1e1a2e" }}>
        <div className="h-[3px] w-full bg-[#7C3AED]" />
        <div className="p-5 flex flex-col gap-3">
          <SkeletonLine className="w-40" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-5/6" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-4/6" />
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-border overflow-hidden" style={{ backgroundColor: "#1e1a2e" }}>
        <div className="h-[3px] w-full bg-[#F5C518]" />
        <div className="p-5 flex flex-col gap-4">
          <SkeletonLine className="w-56" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-3 border-b border-border flex items-center justify-between gap-4">
              <SkeletonLine className="w-3/4" />
              <SkeletonBlock className="w-4 h-4 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Contributing */}
      <div className="rounded-2xl border border-border overflow-hidden" style={{ backgroundColor: "#1e1a2e" }}>
        <div className="h-[3px] w-full bg-[#22C55E]" />
        <div className="p-5 flex flex-col gap-4">
          <SkeletonLine className="w-32" />
          <SkeletonLine className="w-full" />
          <div className="flex gap-3">
            <SkeletonBlock className="h-10 w-36 rounded-xl" />
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
            <SkeletonBlock className="h-10 w-36 rounded-xl" />
          </div>
          <SkeletonBlock className="h-24 rounded-xl" />
          <SkeletonLine className="w-64" />
        </div>
      </div>

      {/* Credits */}
      <div className="rounded-2xl border border-border overflow-hidden" style={{ backgroundColor: "#1e1a2e" }}>
        <div className="h-[3px] w-full bg-[#F97316]" />
        <div className="p-5 flex flex-col gap-4">
          <SkeletonLine className="w-24" />
          <SkeletonLine className="w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <SkeletonLine className="w-36" />
                <SkeletonLine className="w-24" />
              </div>
              <div className="flex gap-1">
                <SkeletonBlock className="w-8 h-8 rounded-lg" />
                <SkeletonBlock className="w-8 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
