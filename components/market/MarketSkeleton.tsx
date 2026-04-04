"use client";

import { SkeletonBlock, SkeletonLine } from "@/components/layout/PageShell";

function MarketCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <SkeletonBlock className="h-52 rounded-none" />
      <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
        <SkeletonLine className="h-5 w-3/4" />
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-4/5" />
        <div className="h-px bg-border" />
        <SkeletonLine className="h-7 w-24" />
        <SkeletonBlock className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function MarketSkeleton() {
  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 lg:max-w-5xl">
        <section className="rounded-2xl border border-border bg-surface px-6 py-5">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-2">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-6 w-80" />
              <SkeletonLine className="h-4 w-56" />
            </div>
            <div className="hidden shrink-0 space-y-2 rounded-2xl border border-border px-4 py-3 sm:block">
              <SkeletonLine className="h-2.5 w-20" />
              <SkeletonLine className="h-7 w-16" />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <SkeletonLine className="h-4 w-28" />
          <SkeletonBlock className="h-9 w-32 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
