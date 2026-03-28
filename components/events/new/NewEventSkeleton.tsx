import { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";

export function NewEventSkeleton() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5 pb-10">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <SkeletonLine className="w-24" />
          <SkeletonBlock className="h-11 rounded-xl w-full" />
        </div>
      ))}
      <SkeletonBlock className="h-32 rounded-2xl w-full" />
      <SkeletonBlock className="h-12 rounded-xl w-full" />
    </div>
  );
}
