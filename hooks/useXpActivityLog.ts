"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchXpLog } from "@/lib/xpLog/queries";
import { queryKeys } from "@/lib/queryKeys";
import { XPLogEntry } from "@/types/xp";

export interface UseXpActivityLogResult {
  rawEntries: XPLogEntry[];
  loading: boolean;
  hasMore: boolean;
}

/**
 * Loads the user's xpLog (newest first, limit 21) for activity feed and resume.
 * Uses TanStack Query — subsequent visits return cached data instantly.
 */
export function useXpActivityLog(uid: string): UseXpActivityLogResult {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.xpLog(uid),
    queryFn: () => fetchXpLog(uid),
    enabled: !!uid,
    staleTime: 60 * 1000,
  });

  return {
    rawEntries: data?.rawEntries ?? [],
    loading: isPending,
    hasMore: data?.hasMore ?? false,
  };
}
