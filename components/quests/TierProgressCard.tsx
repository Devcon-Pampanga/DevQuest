"use client";

import { Quest, QuestCompletion } from "@/types/quest";

export interface TierProgressCardProps {
  teamId: string;
  earnedTier: Quest["tier"];
  earnedTierLabel: string;
  currentTierLabel: string;
  nextTierLabel: string | null;
  color: string;
  quests: Quest[];
  completions: Record<string, QuestCompletion>;
  isMaxTier: boolean;
}

export function TierProgressCard({
  teamId,
  earnedTier,
  earnedTierLabel,
  currentTierLabel,
  nextTierLabel,
  color,
  quests,
  completions,
  isMaxTier,
}: TierProgressCardProps) {
  const total = quests.length;
  const completedCount = quests.filter(
    (q) => completions[q.questId]?.status === "completed"
  ).length;

  return (
    <div className="rounded-2xl overflow-hidden border border-[#27272A] bg-[#1a1a2e]">
      {/* 4px team-color bar */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} />

      <div className="p-4 sm:p-5">
        {/* ── Top: earned tier — compact, 1 line ── */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/badges/${teamId}_${earnedTier}.png`}
            alt={earnedTierLabel}
            width={44}
            height={44}
            className="object-contain drop-shadow-md shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold tracking-widest text-text-muted">CURRENT TIER</p>
            <p className="font-heading text-base text-text-primary leading-tight truncate">{earnedTierLabel}</p>
          </div>
          {isMaxTier && (
            <span
              className="text-[10px] font-heading font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ color, backgroundColor: `${color}18` }}
            >
              MAX
            </span>
          )}
        </div>

        {/* ── Step divider + working-toward section (hidden when maxed) ── */}
        {!isMaxTier && (
          <>
            {/* Arrow divider */}
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px" style={{ backgroundColor: `${color}25` }} />
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-50 shrink-0"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <div className="flex-1 h-px" style={{ backgroundColor: `${color}25` }} />
            </div>

            {/* ── Bottom: working toward ── */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold tracking-widest text-text-muted mb-0.5">WORKING TOWARD</p>
                  <p className="font-heading text-lg text-text-primary leading-tight">
                    {nextTierLabel ?? currentTierLabel}
                  </p>
                  <p className="text-text-secondary text-xs mt-1">
                    {nextTierLabel
                      ? `Complete all ${total} quests to advance`
                      : "Complete all quests to earn your title"}
                  </p>
                </div>
                <div className="shrink-0 text-right leading-none">
                  <div>
                    <span className="font-heading text-2xl font-bold" style={{ color }}>{completedCount}</span>
                    <span className="text-text-muted font-heading text-lg"> / {total}</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">quests done</p>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5">
                {quests.map((q) => {
                  const s = completions[q.questId]?.status;
                  const isDone = s === "completed";
                  const isPending = s === "pending_approval";
                  return (
                    <div
                      key={q.questId}
                      className="h-2.5 flex-1 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: isDone ? color : isPending ? "#F59E0B" : `${color}20`,
                        border: isDone || isPending ? "none" : `1px solid ${color}40`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
