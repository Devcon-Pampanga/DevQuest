"use client";

import type { ReactNode } from "react";
import { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";

const skeletonCardClass =
  "rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 animate-pulse flex flex-col gap-2";

function QuestSkeletonCard({ children }: { children: ReactNode }) {
  return <div className={skeletonCardClass}>{children}</div>;
}

export function QuestsSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-5 pb-10 lg:items-start">
      <div className="lg:col-span-3 flex flex-wrap gap-2 w-full">
        <SkeletonBlock className="h-9 w-28 rounded-full" />
        <SkeletonBlock className="h-9 w-28 rounded-full" />
        <SkeletonBlock className="h-9 w-28 rounded-full" />
      </div>
      <div className="flex w-full flex-col gap-3 lg:col-span-2">
        <div className="flex flex-col gap-3">
          <SkeletonLine className="w-20" />
          {[0, 1].map((i) => (
            <QuestSkeletonCard key={i}>
              <SkeletonLine className="w-40" />
              <SkeletonLine className="w-full" />
              <SkeletonBlock className="h-1.5 rounded-full w-full" />
            </QuestSkeletonCard>
          ))}
        </div>
        <div className="flex flex-col gap-3 opacity-50">
          <SkeletonLine className="w-20" />
          {[0, 1].map((i) => (
            <QuestSkeletonCard key={i}>
              <SkeletonLine className="w-40" />
              <SkeletonLine className="w-full" />
              <SkeletonBlock className="h-1.5 rounded-full w-full" />
            </QuestSkeletonCard>
          ))}
        </div>
      </div>
      <div className="flex w-full flex-col gap-3 sm:gap-4 lg:col-span-1 lg:gap-5">
        <QuestSkeletonCard>
          <SkeletonLine className="w-20" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-3/4" />
          <SkeletonBlock className="h-24 rounded-xl w-full" />
        </QuestSkeletonCard>
        <QuestSkeletonCard>
          <SkeletonLine className="w-16" />
          <SkeletonLine className="w-12" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} className="h-10 rounded-lg w-full" />
            ))}
          </div>
          <SkeletonBlock className="h-8 rounded-xl w-full" />
        </QuestSkeletonCard>
      </div>
    </div>
  );
}
