import { TIER_ORDER } from "@/lib/seed/quests";
import { getEarnedTier } from "@/lib/quest-utils";
import { Quest, QuestCompletion } from "@/types/quest";

export interface VolunteerBadgeDef {
  id: number;
  name: string;
  description: string;
  earned: boolean;
  image: string;
}

export function buildVolunteerBadgeList(params: {
  teams: string[];
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
  eventCount: number;
  reflectionCount: number;
  completedQuestCount: number;
  profileSetupCount: number;
  xp: number;
}): VolunteerBadgeDef[] {
  const {
    teams,
    completions,
    allQuests,
    eventCount,
    reflectionCount,
    completedQuestCount,
    profileSetupCount,
    xp,
  } = params;

  const earnedIdx = (tid: string) =>
    TIER_ORDER.indexOf(getEarnedTier(tid, completions, allQuests));

  const b10 = teams.some((tid) => earnedIdx(tid) >= TIER_ORDER.indexOf("associate"));
  const b11 = teams.some((tid) => earnedIdx(tid) >= TIER_ORDER.indexOf("specialist"));
  const b12 = teams.some((tid) => getEarnedTier(tid, completions, allQuests) === "lead");

  return [
    { id: 1, name: "First Steps", description: "Attend at least 1 event", earned: eventCount >= 1, image: "/medals/first-steps.png" },
    { id: 2, name: "Dedicated Volunteer", description: "Attend at least 5 events", earned: eventCount >= 5, image: "/medals/dedicated-volunteer.png" },
    { id: 3, name: "Event Veteran", description: "Attend at least 10 events", earned: eventCount >= 10, image: "/medals/event-veteran.png" },
    { id: 4, name: "First Reflection", description: "Submit at least 1 reflection", earned: reflectionCount >= 1, image: "/medals/first-reflection.png" },
    { id: 5, name: "Reflective Contributor", description: "Submit at least 5 reflections", earned: reflectionCount >= 5, image: "/medals/reflective-contributor.png" },
    { id: 6, name: "Deep Thinker", description: "Submit at least 10 reflections", earned: reflectionCount >= 10, image: "/medals/deep-thinker.png" },
    { id: 7, name: "Quest Starter", description: "Complete at least 1 quest", earned: completedQuestCount >= 1, image: "/medals/quest-starter.png" },
    { id: 8, name: "Quest Achiever", description: "Complete at least 5 quests", earned: completedQuestCount >= 5, image: "/medals/quest-achiever.png" },
    { id: 9, name: "Quest Master", description: "Complete at least 10 quests", earned: completedQuestCount >= 10, image: "/medals/quest-master.png" },
    { id: 10, name: "Associate", description: "Reach Associate tier or higher on any team", earned: b10, image: "/medals/associate.png" },
    { id: 11, name: "Specialist", description: "Reach Specialist tier or higher on any team", earned: b11, image: "/medals/specialist.png" },
    { id: 12, name: "Team Lead", description: "Complete the Lead tier on any team", earned: b12, image: "/medals/team-lead.png" },
    { id: 13, name: "Profile Complete", description: "Complete profile setup", earned: profileSetupCount >= 1, image: "/medals/profile-complete.png" },
    { id: 14, name: "XP Milestone: 500", description: "Reach 500 total XP", earned: xp >= 500, image: "/medals/xp-500.png" },
    { id: 15, name: "XP Milestone: 1000", description: "Reach 1000 total XP", earned: xp >= 1000, image: "/medals/xp-1000.png" },
  ];
}
