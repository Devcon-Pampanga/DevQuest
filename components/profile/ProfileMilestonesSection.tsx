"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";
import { formatDate } from "@/lib/quest-utils";
import { TIER_ORDER, TIER_LABELS, TEAM_META } from "@/lib/seed/quests";
import { Quest, QuestCompletion } from "@/types/quest";
import { LockIcon } from "@/components/ui/icons";
import {
  computeTierStatus,
  getTierDate,
  questsForTier,
  type TierLadderStatus,
} from "@/lib/tierLadder";
import type { ProfilePageUser } from "@/components/profile/types";

function TierTimelineItem({
  tier,
  teamId,
  status,
  teamColor,
  leadTitle,
  completedAt,
  completedCount,
  totalQuests,
  isLast,
  barsReady,
}: {
  tier: Quest["tier"];
  teamId: string;
  status: TierLadderStatus;
  teamColor: string;
  leadTitle: string;
  completedAt: Timestamp | null;
  completedCount: number;
  totalQuests: number;
  isLast: boolean;
  barsReady: boolean;
}) {
  const label = tier === "lead" ? leadTitle : (TIER_LABELS[tier] ?? tier);
  const badgeImgSrc = `/badges/${teamId}_${tier}.png`;

  return (
    <div className="flex gap-4">
      {/* Left: badge image + connector */}
      <div className="flex flex-col items-center">
        <div className="relative shrink-0">
          <Image
            src={badgeImgSrc}
            alt={label}
            width={52}
            height={52}
            className={`transition-all select-none ${
              status === "locked" ? "grayscale opacity-30" : ""
            } ${status === "current" ? "animate-pulse" : ""}`}
            style={
              status === "completed"
                ? { filter: `drop-shadow(0 0 8px ${teamColor}88)` }
                : undefined
            }
          />
          {status === "locked" && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500">
              <LockIcon size={10} />
            </div>
          )}
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 min-h-10 mt-1"
            style={{ backgroundColor: status === "completed" ? `${teamColor}60` : "#27272A" }}
          />
        )}
      </div>

      {/* Right: content */}
      <div className="flex-1 min-w-0 pb-5">
        <div className="flex items-center justify-between gap-2 flex-wrap pt-3">
          <span
            className={`font-heading font-semibold ${
              status === "locked" ? "text-zinc-500" : "text-text-primary"
            }`}
          >
            {label}
          </span>
          {status === "completed" && completedAt && (
            <span className="text-xs text-text-muted font-sans">{formatDate(completedAt)}</span>
          )}
          {status === "current" && (
            <span
              className="text-[10px] font-heading uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${teamColor}22`, color: teamColor }}
            >
              In Progress
            </span>
          )}
        </div>
        {tier === "team_member" && status === "completed" && (
          <p className="text-xs text-text-muted font-sans mt-0.5">Entry tier</p>
        )}
        {status === "current" && totalQuests > 0 && (
          <>
            <p className="text-sm text-text-secondary font-sans mt-1">
              {completedCount} / {totalQuests} quests complete
            </p>
            <div className="h-1.5 rounded-full bg-border mt-2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: "100%",
                  backgroundColor: teamColor,
                  transformOrigin: "left center",
                  transform: `scaleX(${barsReady ? (totalQuests ? completedCount / totalQuests : 0) : 0})`,
                  transition: barsReady ? "transform 700ms cubic-bezier(0.16, 1, 0.3, 1) 150ms" : "none",
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ProfileMilestonesSection({
  userData,
  completions,
  allQuests,
  activeTeam,
  onTeamChange,
}: {
  userData: ProfilePageUser;
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
  activeTeam: string;
  onTeamChange: (id: string) => void;
}) {
  const teams = userData.teams ?? [];
  const meta = TEAM_META[activeTeam];
  const color = meta?.color ?? "#A855F7";
  const leadTitle = meta?.leadTitle ?? TIER_LABELS.lead;

  const [barsReady, setBarsReady] = useState(false);
  useEffect(() => {
    setBarsReady(false);
    const t = setTimeout(() => setBarsReady(true), 300);
    return () => clearTimeout(t);
  }, [activeTeam]);

  return (
    <div className="rounded-2xl bg-surface border border-border flex flex-col overflow-hidden">
      <div className="px-6 pt-5 pb-0">
        <h3 className="font-heading text-lg text-text-primary mb-4">Tier progression</h3>
      </div>

      {/* Tab navigation */}
      {teams.length >= 2 && (
        <div className="scrollbar-none flex border-b border-border overflow-x-auto px-6">
          {teams.map((tid) => {
            const m = TEAM_META[tid];
            const c = m?.color ?? "#A855F7";
            const active = activeTeam === tid;
            return (
              <button
                key={tid}
                type="button"
                onClick={() => onTeamChange(tid)}
                className="shrink-0 px-3 py-2.5 text-sm font-heading font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap"
                style={{
                  borderBottomColor: active ? c : "transparent",
                  color: active ? c : "#71717A",
                }}
              >
                {m?.label ?? tid}
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <div className="px-6 pt-5 pb-2">
        {TIER_ORDER.map((tier, i) => {
          const createdAt = userData.createdAt;
          const status = computeTierStatus(activeTeam, tier, completions, allQuests);
          const tierQuests = questsForTier(activeTeam, tier, allQuests);
          const completedCount = tierQuests.filter(
            (q) => completions[q.questId]?.status === "completed"
          ).length;
          const totalQuests = tierQuests.length;
          const date = getTierDate(activeTeam, tier, completions, allQuests, createdAt);
          return (
            <TierTimelineItem
              key={tier}
              tier={tier}
              teamId={activeTeam}
              status={status}
              teamColor={color}
              leadTitle={leadTitle}
              completedAt={date}
              completedCount={completedCount}
              totalQuests={totalQuests}
              isLast={i === TIER_ORDER.length - 1}
              barsReady={barsReady}
            />
          );
        })}
      </div>
    </div>
  );
}
