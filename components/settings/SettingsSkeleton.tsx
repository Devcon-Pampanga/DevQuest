import { SkeletonBlock } from "@/components/layout/PageShell";

export function SettingsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-5 pb-10">
        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-52" />
        <SkeletonBlock className="h-32" />
      </div>
    </div>
  );
}
