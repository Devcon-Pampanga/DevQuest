"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboardVolunteers } from "@/lib/leaderboard/queries";
import { queryKeys } from "@/lib/queryKeys";
import type { ChapterVolunteer } from "@/types/chapter";

export function useLeaderboardVolunteers(viewingChapterId: string) {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.leaderboard(viewingChapterId),
    queryFn: () => fetchLeaderboardVolunteers(viewingChapterId),
    enabled: !!viewingChapterId,
    staleTime: 30 * 1000,
  });

  return {
    volunteers: (data ?? []) as ChapterVolunteer[],
    loadingData: isPending,
  };
}
