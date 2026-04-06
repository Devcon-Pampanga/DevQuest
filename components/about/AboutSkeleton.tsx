import { SkeletonBlock } from "@/components/layout/PageShell";

export function AboutSkeleton() {
  return (
    <div className="space-y-4 pb-10">
      <SkeletonBlock className="h-36" />
      <SkeletonBlock className="h-64" />
      <SkeletonBlock className="h-52" />
      <SkeletonBlock className="h-40" />
    </div>
  );
}
