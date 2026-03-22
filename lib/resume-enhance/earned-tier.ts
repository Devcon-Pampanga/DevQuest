import { TIER_ORDER } from "@/lib/seed/quests";
import type { Quest, QuestCompletion } from "@/types/quest";

export function getEarnedTier(
  teamId: string,
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): Quest["tier"] {
  let earned: Quest["tier"] = "team_member";
  for (const tier of TIER_ORDER) {
    const tierQs = allQuests.filter((q) => q.teamId === teamId && q.tier === tier);
    if (tierQs.every((q) => completions[q.questId]?.status === "completed")) {
      earned = tier;
    } else {
      break;
    }
  }
  return earned;
}
