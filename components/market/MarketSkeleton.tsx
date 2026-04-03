"use client";

import { SkeletonBlock, SkeletonLine } from "@/components/layout/PageShell";

function MarketCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <SkeletonBlock className="h-14 w-14 rounded-2xl" />
        <SkeletonLine className="h-5 w-16" />
      </div>
      <div className="mt-5 space-y-3">
        <SkeletonLine className="h-5 w-2/3" />
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-5/6" />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <SkeletonBlock className="h-8 w-20 rounded-full" />
        <SkeletonBlock className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export function MarketSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-10">
      <SkeletonBlock className="h-56 rounded-[28px]" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <SkeletonBlock key={item} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <SkeletonBlock className="h-24 rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <MarketCardSkeleton key={item} />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <SkeletonBlock className="h-72 rounded-[28px]" />
          <SkeletonBlock className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
