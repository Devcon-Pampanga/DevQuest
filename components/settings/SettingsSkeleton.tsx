import { SkeletonBlock } from "@/components/layout/PageShell";

export function SettingsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:items-start pb-10">
        <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-2">
          <SkeletonBlock className="h-64" />
          <SkeletonBlock className="h-32" />
        </div>
        <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-1">
          <SkeletonBlock className="h-52" />
        </div>
      </div>
    </div>
  );
}
