import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";
import { EventCarouselSkeletonRow } from "@/components/events/EventCarouselSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="p-6">
      <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-6 items-start pb-10">
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] overflow-hidden animate-pulse">
            <div className="p-5 relative flex flex-col gap-4">
              <div className="hidden sm:flex absolute top-5 right-5 gap-2 z-10">
                <SkeletonBlock className="h-9 w-16 rounded-xl" />
                <SkeletonBlock className="h-9 w-16 rounded-xl" />
              </div>
              <div className="h-fit w-full flex flex-row items-center gap-4 min-w-0 sm:pr-[11rem]">
                <SkeletonBlock className="size-[4.5rem] sm:size-20 rounded-xl shrink-0" />
                <div className="min-w-0 flex flex-col justify-center gap-1 flex-1">
                  <SkeletonLine className="w-full max-w-[14rem]" />
                  <SkeletonLine className="w-28" />
                  <SkeletonLine className="w-36" />
                </div>
              </div>
              <div className="border-t border-[#27272A] pt-4 flex flex-col gap-2">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <SkeletonLine className="w-12" />
                    <SkeletonLine className="w-8" />
                  </div>
                  <div className="space-y-1 text-right">
                    <SkeletonLine className="w-16 ml-auto" />
                    <SkeletonLine className="w-24 ml-auto" />
                  </div>
                </div>
                <SkeletonBlock className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <SkeletonLine className="w-28" />
              <SkeletonLine className="w-12" />
            </div>
            <div className="grid grid-cols-1 gap-3 animate-pulse">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <SkeletonLine className="w-32" />
                    <SkeletonBlock className="h-5 w-14 rounded-lg shrink-0" />
                  </div>
                  <SkeletonLine className="w-full" />
                  <SkeletonLine className="w-3/4" />
                  <div className="border-t border-[#27272A] pt-2 mt-1">
                    <SkeletonLine className="w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <SkeletonLine className="w-36" />
              <SkeletonLine className="w-12" />
            </div>
            <EventCarouselSkeletonRow count={3} />
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 flex flex-col gap-2.5">
              <SkeletonLine className="w-24" />
              <SkeletonBlock className="h-1.5 w-full rounded-full" />
              <SkeletonLine className="w-16" />
            </div>
          ))}
          <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 flex flex-col gap-2">
            <SkeletonLine className="w-28" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <SkeletonBlock className="w-5 h-5 rounded-md shrink-0" />
                <SkeletonBlock className="w-7 h-7 rounded-lg shrink-0" />
                <SkeletonLine className="flex-1" />
                <SkeletonLine className="w-10 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPageShellLoading() {
  return (
    <PageShell title="Dashboard" loading skeleton={<DashboardSkeleton />}>
      {null}
    </PageShell>
  );
}
