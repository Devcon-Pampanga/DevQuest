"use client";

import { useState } from "react";
import Image from "next/image";
import { isTierUnlocked } from "@/lib/quest-utils";
import { TIER_ORDER } from "@/lib/seed/quests";
import { LockIcon } from "@/components/ui/icons";
import { Quest, QuestCompletion } from "@/types/quest";

function getEarnedTier(
  teamId: string,
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): Quest["tier"] {
  for (const tier of TIER_ORDER) {
    if (!isTierUnlocked(teamId, tier, completions, allQuests)) continue;
    const tierQuests = allQuests.filter((q) => q.teamId === teamId && q.tier === tier);
    const allDone = tierQuests.every((q) => completions[q.questId]?.status === "completed");
    if (!allDone) return tier;
  }
  return TIER_ORDER[TIER_ORDER.length - 1];
}

interface QuestBadgeDef {
  name: string;
  description: string;
  earned: boolean;
  image: string;
}

function QuestBadgeTile({ badge }: { badge: QuestBadgeDef }) {
  return (
    <div
      className="relative rounded-xl border border-border bg-[#0a0a0f] p-3 flex flex-col items-center gap-2 text-center hover:scale-[1.03] transition-transform duration-200"
      title={badge.earned ? badge.name : badge.description}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          badge.earned ? "" : "grayscale opacity-50"
        }`}
        style={
          badge.earned
            ? { boxShadow: "0 0 0 2px #7C3AED", backgroundColor: "#1a1a2e" }
            : { backgroundColor: "#1a1a2e" }
        }
      >
        <Image src={badge.image} alt={badge.name} width={32} height={32} className="object-contain" />
      </div>
      {!badge.earned && (
        <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-zinc-500">
          <LockIcon size={12} />
        </div>
      )}
      <p className="text-[10px] font-heading font-semibold text-text-primary leading-tight">{badge.name}</p>
    </div>
  );
}

export function QuestBadgesCard({
  teamColor,
  completions,
  allQuests,
  teams,
  xp,
  eventCount,
  reflectionCount,
  profileSetupCount,
}: {
  teamColor: string;
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
  teams: string[];
  xp: number;
  eventCount: number;
  reflectionCount: number;
  profileSetupCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 6;

  const completedQuestCount = Object.values(completions).filter(
    (c) => c.status === "completed"
  ).length;

  const earnedIdx = (tid: string) =>
    TIER_ORDER.indexOf(getEarnedTier(tid, completions, allQuests));

  const b10 = teams.some((tid) => earnedIdx(tid) >= TIER_ORDER.indexOf("associate"));
  const b11 = teams.some((tid) => earnedIdx(tid) >= TIER_ORDER.indexOf("specialist"));
  const b12 = teams.some((tid) => getEarnedTier(tid, completions, allQuests) === "lead");

  const badges: QuestBadgeDef[] = [
    { name: "First Steps", description: "Attend at least 1 event", earned: eventCount >= 1, image: "/medals/first-steps.png" },
    { name: "Dedicated Volunteer", description: "Attend at least 5 events", earned: eventCount >= 5, image: "/medals/dedicated-volunteer.png" },
    { name: "Event Veteran", description: "Attend at least 10 events", earned: eventCount >= 10, image: "/medals/event-veteran.png" },
    { name: "First Reflection", description: "Submit at least 1 reflection", earned: reflectionCount >= 1, image: "/medals/first-reflection.png" },
    { name: "Reflective Contributor", description: "Submit at least 5 reflections", earned: reflectionCount >= 5, image: "/medals/reflective-contributor.png" },
    { name: "Deep Thinker", description: "Submit at least 10 reflections", earned: reflectionCount >= 10, image: "/medals/deep-thinker.png" },
    { name: "Quest Starter", description: "Complete at least 1 quest", earned: completedQuestCount >= 1, image: "/medals/quest-starter.png" },
    { name: "Quest Achiever", description: "Complete at least 5 quests", earned: completedQuestCount >= 5, image: "/medals/quest-achiever.png" },
    { name: "Quest Master", description: "Complete at least 10 quests", earned: completedQuestCount >= 10, image: "/medals/quest-master.png" },
    { name: "Associate", description: "Reach Associate tier or higher on any team", earned: b10, image: "/medals/associate.png" },
    { name: "Specialist", description: "Reach Specialist tier or higher on any team", earned: b11, image: "/medals/specialist.png" },
    { name: "Team Lead", description: "Complete the Lead tier on any team", earned: b12, image: "/medals/team-lead.png" },
    { name: "Profile Complete", description: "Complete profile setup", earned: profileSetupCount >= 1, image: "/medals/profile-complete.png" },
    { name: "XP Milestone: 500", description: "Reach 500 total XP", earned: xp >= 500, image: "/medals/xp-500.png" },
    { name: "XP Milestone: 1000", description: "Reach 1000 total XP", earned: xp >= 1000, image: "/medals/xp-1000.png" },
  ];

  const earnedBadges = badges.filter((b) => b.earned);
  const unearnedBadges = badges.filter((b) => !b.earned);
  const preview = [...earnedBadges, ...unearnedBadges].slice(0, LIMIT);
  const displayed = expanded ? badges : preview;
  const earned = earnedBadges.length;

  return (
    <div className="rounded-2xl border border-border overflow-hidden animate-fade-up" style={{ backgroundColor: "#1e1a2e", animationDelay: "300ms" }}>
      <div className="h-[3px] w-full" style={{ backgroundColor: teamColor }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-semibold text-text-muted tracking-widest uppercase">Badges</p>
          <div className="flex-1 h-px bg-[#27272A]" />
          <p className="text-xs text-text-muted">{earned} / {badges.length}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {displayed.map((b) => (
            <QuestBadgeTile key={b.name} badge={b} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full py-2 rounded-xl border border-border text-xs font-heading uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors"
        >
          {expanded ? "Show Less" : `Show All ${badges.length} Badges`}
        </button>
      </div>
    </div>
  );
}
