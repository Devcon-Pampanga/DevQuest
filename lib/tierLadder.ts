import { Timestamp } from "firebase/firestore";
import { Quest, QuestCompletion } from "@/types/quest";
import { getCurrentTier, isTierUnlocked } from "@/lib/quest-utils";

export type TierLadderStatus = "completed" | "current" | "locked";

export function questsForTier(teamId: string, tier: Quest["tier"], allQuests: Quest[]): Quest[] {
  return allQuests.filter((q) => q.teamId === teamId && q.tier === tier);
}

export function getTierDate(
  teamId: string,
  tier: Quest["tier"],
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[],
  userCreatedAt: Timestamp | undefined
): Timestamp | null {
  if (tier === "team_member") return userCreatedAt ?? null;
  const qs = questsForTier(teamId, tier, allQuests);
  let max: Timestamp | null = null;
  for (const q of qs) {
    const c = completions[q.questId];
    if (c?.status !== "completed" || !c.completedAt) continue;
    if (!max || c.completedAt.toMillis() > max.toMillis()) max = c.completedAt;
  }
  return max;
}

export function computeTierStatus(
  teamId: string,
  tier: Quest["tier"],
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): TierLadderStatus {
  if (tier === "team_member") return "completed";
  if (!isTierUnlocked(teamId, tier, completions, allQuests)) return "locked";
  const tierQuests = questsForTier(teamId, tier, allQuests);
  const allDone =
    tierQuests.length > 0 && tierQuests.every((q) => completions[q.questId]?.status === "completed");
  if (allDone) return "completed";
  const cur = getCurrentTier(teamId, completions, allQuests);
  if (tier === cur) return "current";
  return "locked";
}
