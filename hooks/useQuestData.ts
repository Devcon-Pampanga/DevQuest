"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchQuestPageData } from "@/lib/quests/queries";
import { queryKeys } from "@/lib/queryKeys";
import { Quest, QuestCompletion } from "@/types/quest";
import { Mission, MissionCompletion } from "@/types/mission";

export interface QuestDataResult {
  quests: Quest[];
  completions: Record<string, QuestCompletion>;
  setCompletions: React.Dispatch<React.SetStateAction<Record<string, QuestCompletion>>>;
  missions: Mission[];
  setMissions: React.Dispatch<React.SetStateAction<Mission[]>>;
  missionCompletions: Record<string, MissionCompletion>;
  setMissionCompletions: React.Dispatch<React.SetStateAction<Record<string, MissionCompletion>>>;
  reflectionCount: number;
  eventCount: number;
  profileSetupCount: number;
  loadingQuests: boolean;
  loadingMissions: boolean;
}

/**
 * Fetches all quest/mission data for a given user.
 * Uses TanStack Query for caching — subsequent visits return data instantly.
 * Mutable overlays (completions, missions) are seeded from cache on mount
 * and can be updated locally by quest actions without triggering re-fetches.
 */
export function useQuestData(uid: string, chapterId: string): QuestDataResult {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.questData(uid, chapterId),
    queryFn: () => fetchQuestPageData(uid, chapterId),
    enabled: !!uid && !!chapterId,
    staleTime: 60 * 1000,
  });

  // Mutable overlays — updated optimistically by useQuestActions
  const [completions, setCompletions] = useState<Record<string, QuestCompletion>>({});
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<Record<string, MissionCompletion>>({});

  // Seed local state from query data once per mount.
  // Using a ref ensures optimistic updates from actions aren't overwritten
  // by background refetches during the same session.
  const seeded = useRef(false);
  useEffect(() => {
    if (data && !seeded.current) {
      seeded.current = true;
      setCompletions(data.completions);
      setMissions(data.missions);
      setMissionCompletions(data.missionCompletions);
    }
  }, [data]);

  return {
    quests: data?.quests ?? [],
    completions,
    setCompletions,
    missions,
    setMissions,
    missionCompletions,
    setMissionCompletions,
    reflectionCount: data?.reflectionCount ?? 0,
    eventCount: data?.eventCount ?? 0,
    profileSetupCount: data?.profileSetupCount ?? 0,
    loadingQuests: isPending,
    loadingMissions: isPending,
  };
}
