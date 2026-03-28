"use client";

import { useMemo } from "react";
import type { ChapterSessionUser, ChapterVolunteer } from "@/types/chapter";

export function useLeaderboardRankings(
  volunteers: ChapterVolunteer[],
  teamFilter: string,
  currentUser: ChapterSessionUser | null
) {
  const filtered = useMemo(() => {
    const base =
      teamFilter === "all"
        ? volunteers
        : volunteers.filter((v) => v.teams.includes(teamFilter));
    return [...base].sort((a, b) => b.xp - a.xp);
  }, [volunteers, teamFilter]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const myRank = currentUser
    ? filtered.findIndex((v) => v.uid === currentUser.uid) + 1
    : 0;
  const me = currentUser ? filtered.find((v) => v.uid === currentUser.uid) : undefined;
  const xpToNext =
    me && myRank > 1 ? (filtered[myRank - 2]?.xp ?? 0) - me.xp : 0;

  return {
    filtered,
    top3,
    rest,
    myRank,
    me,
    xpToNext,
  };
}
