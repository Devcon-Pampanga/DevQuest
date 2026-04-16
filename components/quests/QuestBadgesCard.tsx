"use client";

import { useState } from "react";
import Image from "next/image";
import { buildVolunteerBadgeList } from "@/lib/volunteerBadges";
import { LockIcon } from "@/components/ui/icons";
import { Quest, QuestCompletion } from "@/types/quest";

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
  completions,
  allQuests,
  teams,
  xp,
  eventCount,
  reflectionCount,
  profileSetupCount,
}: {
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

  const badges: QuestBadgeDef[] = buildVolunteerBadgeList({
    teams,
    completions,
    allQuests,
    eventCount,
    reflectionCount,
    completedQuestCount,
    profileSetupCount,
    xp,
  }).map(({ name, description, earned, image }) => ({ name, description, earned, image }));

  const earnedBadges = badges.filter((b) => b.earned);
  const unearnedBadges = badges.filter((b) => !b.earned);
  const preview = [...earnedBadges, ...unearnedBadges].slice(0, LIMIT);
  const displayed = expanded ? badges : preview;
  const earned = earnedBadges.length;

  return (
    <div className="rounded-2xl border border-border overflow-hidden animate-fade-up" style={{ backgroundColor: "#1e1a2e", animationDelay: "300ms" }}>
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
