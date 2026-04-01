import { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";

export function ProfileSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5 pb-10">
      <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] animate-pulse p-5">
        <div className="flex gap-4">
          <SkeletonBlock className="w-[72px] h-[72px] rounded-2xl shrink-0" />
          <div className="flex flex-col gap-3 flex-1">
            <SkeletonLine className="w-32" />
            <SkeletonLine className="w-48" />
            <SkeletonLine className="w-24" />
          </div>
        </div>
        <div className="border-t border-[#27272A] mt-5 pt-5 flex flex-col gap-3">
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-3/4" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-1/2" />
        </div>
      </div>
      <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] animate-pulse p-5 flex flex-col gap-4">
        <SkeletonLine className="w-32" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <SkeletonLine className="w-28" />
              <SkeletonLine className="w-20" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <SkeletonBlock className="h-16 rounded-xl" />
        <SkeletonBlock className="h-16 rounded-xl" />
        <SkeletonBlock className="h-16 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] animate-pulse p-5 flex flex-col gap-4">
        <SkeletonLine className="w-24" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <SkeletonBlock className="w-2 h-2 rounded-full mt-1 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
