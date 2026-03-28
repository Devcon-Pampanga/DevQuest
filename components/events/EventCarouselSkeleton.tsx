import { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";

export function EventCarouselCardSkeleton() {
  return (
    <div className="shrink-0 rounded-xl border border-[#27272A] overflow-hidden w-[210px]">
      <SkeletonBlock className="h-28 w-full rounded-none" />
      <div className="p-3 flex flex-col gap-2">
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-2/3" />
        <SkeletonBlock className="h-1 w-full rounded-full mt-2" />
        <SkeletonLine className="w-24" />
      </div>
    </div>
  );
}

export function EventCarouselSkeletonRow({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 animate-pulse scrollbar-minimal">
      {Array.from({ length: count }, (_, i) => (
        <EventCarouselCardSkeleton key={i} />
      ))}
    </div>
  );
}
