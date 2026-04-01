"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEventsWithCounts } from "@/lib/events/queries";
import { queryKeys } from "@/lib/queryKeys";
import type { ChapterSessionUser } from "@/types/chapter";

export function useEventsListData(userData: ChapterSessionUser | null) {
  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.events(),
    queryFn: fetchEventsWithCounts,
    enabled: !!userData,
    staleTime: 60 * 1000,
  });

  return {
    events: data?.events ?? [],
    loadingEvents: isPending,
    fetchError: error
      ? "Could not load events. Check the console for details."
      : "",
    registrationCounts: data?.registrationCounts ?? {},
    countsLoading: false,
  };
}
