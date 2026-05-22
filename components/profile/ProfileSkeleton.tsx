"use client";

import { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface border border-border p-4 sm:p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between gap-2">
        <SkeletonLine className="w-20" />
        <SkeletonBlock className="hidden sm:block h-7 w-7 rounded-xl shrink-0" />
      </div>
      <SkeletonBlock className="h-9 w-12 rounded-lg" />
      <SkeletonBlock className="h-0.5 w-10 rounded-full" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:gap-6 pb-10">

      {/* Header — full width */}
      <SkeletonBlock className="lg:col-span-3 h-36 rounded-2xl" />

      {/* Stat cards — full width */}
      <div className="lg:col-span-3 grid grid-cols-3 gap-3 lg:gap-6">
        {[0, 1, 2].map((i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Left 2/3 */}
      <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-2">
        <SkeletonBlock className="h-72 rounded-2xl" />
        <SkeletonBlock className="h-52 rounded-2xl" />
      </div>

      {/* Right 1/3 */}
      <div className="lg:col-span-1">
        <SkeletonBlock className="h-80 rounded-2xl" />
      </div>

    </div>
  );
}
