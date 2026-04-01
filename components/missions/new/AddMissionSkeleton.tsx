import { SkeletonBlock } from "@/components/layout/PageShell";

export function AddMissionSkeleton() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5 pb-10">
      <SkeletonBlock className="h-8 w-48 rounded-lg" />
      <SkeletonBlock className="h-40 rounded-2xl" />
      <SkeletonBlock className="h-48 rounded-2xl" />
      <SkeletonBlock className="h-32 rounded-2xl" />
    </div>
  );
}
