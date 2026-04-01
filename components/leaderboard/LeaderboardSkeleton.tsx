"use client";

import { SkeletonBlock } from "@/components/layout/PageShell";

export function LeaderboardSkeleton() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-10">
      <SkeletonBlock className="h-20 rounded-2xl" />

      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-10 rounded-xl" />
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      <div className="flex items-end gap-4 justify-center">
        <div className="flex-1 rounded-xl bg-[#1a1a2e] animate-pulse" style={{ height: 160 }} />
        <div className="flex-1 rounded-xl bg-[#1a1a2e] animate-pulse" style={{ height: 200 }} />
        <div className="flex-1 rounded-xl bg-[#1a1a2e] animate-pulse" style={{ height: 140 }} />
      </div>

      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonBlock key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
