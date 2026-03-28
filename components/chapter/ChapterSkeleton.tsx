"use client";

import { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";

export function ChapterSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-6 pb-10">
      <SkeletonBlock className="h-36 rounded-2xl" />

      <div className="grid grid-cols-3 gap-6 lg:hidden">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <SkeletonBlock className="h-20 rounded-2xl" />
          <div className="flex flex-col gap-2">
            <SkeletonLine className="w-24" />
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl bg-[#1a1a2e] animate-pulse shrink-0" style={{ width: 210, height: 180 }} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SkeletonLine className="w-20" />
            <SkeletonBlock className="h-10 rounded-xl" />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-7 w-20 rounded-full" />)}
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonBlock key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-start-3 lg:col-span-1">
          <SkeletonBlock className="h-80 rounded-2xl" />
          <SkeletonBlock className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
