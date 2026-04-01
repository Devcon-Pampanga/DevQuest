"use client";

import { useState, useEffect } from "react";

export function useLeaderboardFilters(viewingChapterId: string) {
  const [teamFilter, setTeamFilter] = useState("all");
  const [seasonTab, setSeasonTab] = useState<"season" | "all-time">("season");

  useEffect(() => {
    setTeamFilter("all");
  }, [viewingChapterId]);

  return {
    teamFilter,
    setTeamFilter,
    seasonTab,
    setSeasonTab,
  };
}
