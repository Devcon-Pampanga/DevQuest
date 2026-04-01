"use client";

import { useMemo } from "react";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import { useCoordinatorHubData } from "@/hooks/useCoordinatorHubData";
import { CoordinatorStatsRow } from "@/components/quests/coordinator/CoordinatorStatsRow";
import { CoordinatorVolunteersPanel } from "@/components/quests/coordinator/CoordinatorVolunteersPanel";
import { CoordinatorTeamsPanel } from "@/components/quests/coordinator/CoordinatorTeamsPanel";
import { CoordinatorMissionsPanel } from "@/components/quests/coordinator/CoordinatorMissionsPanel";
import PageShell from "@/components/layout/PageShell";
import { SkeletonBlock, SkeletonLine } from "@/components/layout/PageShell";

interface CoordinatorHubPageProps {
  user: {
    uid: string;
    username: string;
    chapterId: string;
    avatarOptions?: import("@/lib/avatar").AvatarOptions;
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CoordinatorHubSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-5 pb-10 lg:items-start">
      {/* Stats row */}
      <div className="lg:col-span-3 flex flex-col sm:flex-row gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 rounded-2xl border border-[#27272A] bg-[#16213e] p-4 flex items-center gap-3 animate-pulse">
            <SkeletonBlock className="w-9 h-9 rounded-xl" />
            <div className="flex flex-col gap-1.5">
              <SkeletonBlock className="h-6 w-10 rounded" />
              <SkeletonLine className="w-24" />
            </div>
          </div>
        ))}
      </div>
      {/* Left panel */}
      <div className="lg:col-span-2 rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-5 animate-pulse flex flex-col gap-3">
        <SkeletonLine className="w-28" />
        <SkeletonBlock className="h-9 w-full rounded-xl" />
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-7 w-20 rounded-full" />)}
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <SkeletonBlock className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <SkeletonLine className="w-32" />
              <SkeletonLine className="w-20" />
            </div>
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
      {/* Right panels */}
      <div className="flex flex-col gap-4 lg:col-start-3 lg:col-span-1">
        <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 animate-pulse flex flex-col gap-2">
          <SkeletonLine className="w-16" />
          {[0, 1, 2, 3, 4].map((i) => <SkeletonBlock key={i} className="h-14 w-full rounded-xl" />)}
        </div>
        <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 animate-pulse flex flex-col gap-2">
          <SkeletonLine className="w-20" />
          <SkeletonBlock className="h-9 w-full rounded-xl" />
          {[0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CoordinatorHubPage({ user }: CoordinatorHubPageProps) {
  const avatarUrl = buildAvatarUrl(user.username, user.avatarOptions ?? DEFAULT_AVATAR);

  const { volunteers, missions, pendingApprovalsCount, loading, refresh } =
    useCoordinatorHubData(user.chapterId);

  const activeMissionCount = useMemo(
    () => missions.filter((m) => m.status === "active").length,
    [missions]
  );

  return (
    <PageShell
      title="Volunteers"
      avatarUrl={avatarUrl}
      loading={loading}
      skeleton={<CoordinatorHubSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-5 lg:items-start pb-10">

          {/* ── Stats row (full width) ───────────────────────────────────────── */}
          <CoordinatorStatsRow
            volunteerCount={volunteers.length}
            pendingApprovalsCount={pendingApprovalsCount}
            activeMissionCount={activeMissionCount}
          />

          {/* ── Left: Volunteers panel (2/3 width) ──────────────────────────── */}
          <CoordinatorVolunteersPanel volunteers={volunteers} />

          {/* ── Right: Teams + Missions (1/3 width sidebar) ─────────────────── */}
          <div className="contents lg:flex lg:flex-col gap-4 lg:col-start-3 lg:col-span-1">
            <CoordinatorTeamsPanel volunteers={volunteers} />
            <CoordinatorMissionsPanel
              missions={missions}
              onMissionArchived={refresh}
            />
          </div>

        </div>
      </div>
    </PageShell>
  );
}
