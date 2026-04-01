/**
 * Centralized TanStack Query key factory.
 *
 * All cache keys live here so that:
 * - Hooks never hardcode key strings (no silent typos)
 * - Cache invalidation after mutations is explicit and refactor-safe
 *
 * Usage:
 *   queryKey: queryKeys.events()
 *   queryClient.invalidateQueries({ queryKey: queryKeys.events() })
 */
export const queryKeys = {
  events: () => ["events"] as const,

  leaderboard: (chapterId: string) => ["leaderboard", chapterId] as const,

  questData: (uid: string, chapterId: string) =>
    ["questData", uid, chapterId] as const,

  dashboard: (uid: string, chapterId: string) =>
    ["dashboard", uid, chapterId] as const,

  dashboardApprovals: (chapterId: string) =>
    ["dashboardApprovals", chapterId] as const,

  dashboardVolunteers: (chapterId: string) =>
    ["dashboardVolunteers", chapterId] as const,

  chapter: (chapterId: string) => ["chapter", chapterId] as const,

  xpLog: (uid: string) => ["xpLog", uid] as const,
} as const;
