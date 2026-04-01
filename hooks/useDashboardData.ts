"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardData,
  fetchDashboardApprovals,
  fetchDashboardActiveVolunteers,
} from "@/lib/dashboard/queries";
import { queryKeys } from "@/lib/queryKeys";
import type { ChapterSessionUser } from "@/types/chapter";

export function useDashboardData(
  currentUser: ChapterSessionUser | null,
  authChecked: boolean
) {
  const firebaseUid = currentUser?.uid ?? "";
  const chapterId = currentUser?.chapterId ?? "";
  const isCoordinator = currentUser?.role === "coordinator";

  const { data, isPending: dashboardLoading } = useQuery({
    queryKey: queryKeys.dashboard(firebaseUid, chapterId),
    queryFn: () => fetchDashboardData(firebaseUid, chapterId),
    enabled: authChecked && !!firebaseUid && !!chapterId,
    staleTime: 60 * 1000,
  });

  const { data: approvalsCount = 0 } = useQuery({
    queryKey: queryKeys.dashboardApprovals(chapterId),
    queryFn: () => fetchDashboardApprovals(chapterId),
    enabled: isCoordinator && !!chapterId,
    staleTime: 60 * 1000,
  });

  const { data: chapterVolunteersActive = null } = useQuery({
    queryKey: queryKeys.dashboardVolunteers(chapterId),
    queryFn: () => fetchDashboardActiveVolunteers(chapterId),
    enabled: isCoordinator && !!chapterId,
    staleTime: 60 * 1000,
  });

  // barsReady adds a 350ms animation delay after data loads
  const [barsReady, setBarsReady] = useState(false);
  useEffect(() => {
    if (dashboardLoading) {
      setBarsReady(false);
      return;
    }
    const t = setTimeout(() => setBarsReady(true), 350);
    return () => clearTimeout(t);
  }, [dashboardLoading]);

  return {
    allQuests: data?.allQuests ?? [],
    completions: data?.completions ?? {},
    eventsAttendedCount: data?.eventsAttendedCount ?? 0,
    events: data?.events ?? [],
    pendingReflection: data?.pendingReflection ?? null,
    dashboardLoading,
    approvalsCount,
    chapterVolunteersActive: isCoordinator ? chapterVolunteersActive : null,
    eventsThisMonthCount: data?.eventsThisMonthCount ?? 0,
    upcomingRegCounts: data?.upcomingRegCounts ?? {},
    leaderboard: data?.leaderboard ?? [],
    userLeaderboardRank: data?.userLeaderboardRank ?? null,
    barsReady,
  };
}
