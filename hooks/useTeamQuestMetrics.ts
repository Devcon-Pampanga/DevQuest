"use client";

import { useMemo } from "react";
import { getCurrentTier, getEarnedTier } from "@/lib/quest-utils";
import { TIER_ORDER, TIER_LABELS, TEAM_META } from "@/lib/seed/quests";
import { Quest, QuestCompletion } from "@/types/quest";

export type TeamQuestActiveMeta = (typeof TEAM_META)[string];

export interface TeamQuestMetrics {
  activeMeta: TeamQuestActiveMeta;
  currentTier: Quest["tier"];
  currentTierQuests: Quest[];
  currentTierLabel: string;
  nextTierLabel: string | null;
  earnedTier: Quest["tier"];
  earnedTierLabel: string;
  isMaxTier: boolean;
}

/**
 * Derives tier labels, current-tier quest list, and progress flags for the active team tab.
 * Returns null when activeTab is not a known team (e.g. "approvals").
 */
export function useTeamQuestMetrics(
  activeTab: string,
  quests: Quest[],
  completions: Record<string, QuestCompletion>
): TeamQuestMetrics | null {
  return useMemo(() => {
    const activeMeta = TEAM_META[activeTab];
    if (!activeMeta) return null;

    const currentTier = getCurrentTier(activeTab, completions, quests);
    const currentTierQuests = quests.filter(
      (q) => q.teamId === activeTab && q.tier === currentTier
    );
    const currentTierLabel =
      currentTier === "lead"
        ? (activeMeta.leadTitle ?? TIER_LABELS[currentTier])
        : (TIER_LABELS[currentTier] ?? currentTier);
    const nextTierIdx = TIER_ORDER.indexOf(currentTier) + 1;
    const nextTier = nextTierIdx < TIER_ORDER.length ? TIER_ORDER[nextTierIdx] : null;
    const nextTierLabel = nextTier
      ? nextTier === "lead"
        ? (activeMeta.leadTitle ?? TIER_LABELS[nextTier])
        : TIER_LABELS[nextTier]
      : null;

    const earnedTier = getEarnedTier(activeTab, completions, quests);
    const earnedTierLabel =
      earnedTier === "lead"
        ? (activeMeta.leadTitle ?? TIER_LABELS["lead"])
        : TIER_LABELS[earnedTier];
    const isMaxTier =
      earnedTier === "lead" &&
      quests
        .filter((q) => q.teamId === activeTab && q.tier === "lead")
        .every((q) => completions[q.questId]?.status === "completed");

    return {
      activeMeta,
      currentTier,
      currentTierQuests,
      currentTierLabel,
      nextTierLabel,
      earnedTier,
      earnedTierLabel,
      isMaxTier,
    };
  }, [activeTab, quests, completions]);
}
