"use client";

import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { useAuth } from "@/context/AuthContext";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";

function NotificationsSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto pb-10">
      <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] animate-pulse overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="px-5 py-4 border-b border-[#27272A] flex items-start gap-3"
          >
            <SkeletonBlock className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-40" />
            </div>
            <SkeletonLine className="w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { user: sessionUser, status } = useAuth();
  const { ready } = useRequireDashboardAuth();

  const authLoading = status === "loading" || !ready;
  const avatarUrl = sessionUser
    ? buildAvatarUrl(sessionUser.username, sessionUser.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  return (
    <PageShell
      title="Notifications"
      avatarUrl={avatarUrl}
      loading={authLoading}
      skeleton={<NotificationsSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto pb-10">
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="font-heading text-lg text-text-primary mb-2">No notifications yet</p>
            <p className="text-sm text-text-secondary font-sans leading-relaxed">
              When you get quest updates, attendance confirmations, or event reminders, they&apos;ll show up here.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
