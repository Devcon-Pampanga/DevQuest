"use client";

import { useState, useEffect } from "react";
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

function TierLadderRow({
  tier,
  status,
  teamColor,
  leadTitle,
  completedAt,
  completedCount,
  totalQuests,
  barsReady,
}: {
  tier: Quest["tier"];
  status: TierLadderStatus;
  teamColor: string;
  leadTitle: string;
  completedAt: Timestamp | null;
  completedCount: number;
  totalQuests: number;
  barsReady?: boolean;
}) {
  const label = tier === "lead" ? leadTitle : (TIER_LABELS[tier] ?? tier);

  return (
    <div
      className={`rounded-xl border p-4 flex gap-4 items-start ${
        status === "current" ? "bg-[#1a1a2e] border-[#27272A]" : "border-transparent bg-transparent"
      }`}
      style={status === "current" ? { borderLeftWidth: 3, borderLeftColor: teamColor } : undefined}
    >
      <div className="shrink-0 pt-0.5">
        {status === "locked" && (
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-zinc-500">
            <LockIcon size={14} />
          </div>
        )}
        {status === "completed" && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: teamColor }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {status === "current" && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-transparent animate-pulse"
            style={{
              boxShadow: `0 0 0 3px ${teamColor}`,
              backgroundColor: `${teamColor}22`,
            }}
          >
            <span className="text-xs font-heading font-bold tabular-nums" style={{ color: teamColor }}>
              {completedCount}/{totalQuests}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`font-heading font-semibold ${status === "locked" ? "text-zinc-500" : "text-text-primary"}`}
          >
            {label}
          </span>
          {status === "completed" && completedAt && (
            <span className="text-xs text-text-muted font-sans">{formatDate(completedAt)}</span>
          )}
        </div>
        {status === "current" && totalQuests > 0 && (
          <>
            <p className="text-sm text-text-secondary font-sans mt-1">
              {completedCount} / {totalQuests} quests complete
            </p>
            <div className="h-2 rounded-full bg-border mt-2 overflow-hidden">
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
        {status === "completed" && tier === "team_member" && (
          <p className="text-xs text-text-muted font-sans mt-1">Entry tier</p>
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
    <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col gap-4">
      <h3 className="font-heading text-lg text-text-primary">Team milestones</h3>
      {teams.length >= 2 && (
        <div className="flex flex-wrap gap-2">
          {teams.map((tid) => {
            const m = TEAM_META[tid];
            const c = m?.color ?? "#A855F7";
            const active = activeTeam === tid;
            return (
              <button
                key={tid}
                type="button"
                onClick={() => onTeamChange(tid)}
                className="px-4 py-2 rounded-full text-sm font-heading font-semibold border transition-all"
                style={{
                  borderColor: active ? c : "#27272A",
                  backgroundColor: active ? `${c}1A` : "transparent",
                  color: active ? c : "#71717A",
                }}
              >
                {m?.label ?? tid}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {TIER_ORDER.map((tier) => {
          const createdAt = userData.createdAt;
          const status = computeTierStatus(activeTeam, tier, completions, allQuests);
          const tierQuests = questsForTier(activeTeam, tier, allQuests);
          const completedCount = tierQuests.filter((q) => completions[q.questId]?.status === "completed").length;
          const totalQuests = tierQuests.length;
          const date = getTierDate(activeTeam, tier, completions, allQuests, createdAt);
          return (
            <TierLadderRow
              key={tier}
              tier={tier}
              status={status}
              teamColor={color}
              leadTitle={leadTitle}
              completedAt={date}
              completedCount={completedCount}
              totalQuests={totalQuests}
              barsReady={barsReady}
            />
          );
        })}
      </div>
    </div>
  );
}
