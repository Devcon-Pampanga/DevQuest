"use client";

import { useState } from "react";
import { isTierUnlocked, getCurrentTier } from "@/lib/quest-utils";
import { TIER_ORDER, TIER_LABELS } from "@/lib/seed/quests";
import { Quest, QuestCompletion } from "@/types/quest";

// Three states: completed (muted, 1 line), current (elevated), future (expandable preview).

export function PathJourneySidebar({
  teamId,
  teamColor,
  leadTitle,
  completions,
  allQuests,
}: {
  teamId: string;
  teamColor: string;
  leadTitle: string;
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
}) {
  const currentTier = getCurrentTier(teamId, completions, allQuests);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold tracking-widest text-text-muted mb-3">
        YOUR JOURNEY
      </p>

      {TIER_ORDER.map((tier) => {
        const tierQuests = allQuests.filter((q) => q.teamId === teamId && q.tier === tier);
        const unlocked = isTierUnlocked(teamId, tier, completions, allQuests);
        const completedCount = tierQuests.filter(
          (q) => completions[q.questId]?.status === "completed"
        ).length;
        const total = tierQuests.length;
        const isCurrent = tier === currentTier;
        const isCompleted = unlocked && !isCurrent;
        const tierLabel = tier === "lead" ? leadTitle : (TIER_LABELS[tier] ?? tier);
        const currentTierLabel = currentTier === "lead" ? leadTitle : (TIER_LABELS[currentTier] ?? currentTier);

        if (!unlocked) {
          const isExpanded = expandedTier === tier;
          return (
            <div key={tier}>
              <div
                className="px-3 py-2.5 flex items-center gap-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedTier(isExpanded ? null : tier)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/badges/${teamId}_${tier}.png`}
                  alt={tierLabel}
                  width={20}
                  height={20}
                  className="object-contain shrink-0 grayscale opacity-30"
                />
                <span className="flex-1 text-sm font-heading text-zinc-600">{tierLabel}</span>
                {total > 0 && (
                  <span className="text-[10px] text-zinc-700 mr-1">· {total} quest{total !== 1 ? "s" : ""}</span>
                )}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#52525B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 transition-transform duration-200"
                  style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {isExpanded && total > 0 && (
                <div className="ml-3 pl-3 border-l border-zinc-800 pb-2 flex flex-col gap-1 mt-0.5">
                  {tierQuests.map((q) => (
                    <div key={q.questId} className="flex items-start gap-2 py-1">
                      <div className="mt-0.5 shrink-0">
                        {q.completionMethod === "qr_scan" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                            <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 21h.01M21 14h.01M21 18h.01M21 21h.01" />
                          </svg>
                        )}
                        {q.completionMethod === "self_mark" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {q.completionMethod === "coordinator_approval" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1 text-[11px] text-zinc-600 leading-snug">{q.name}</span>
                      {q.xpReward > 0 && (
                        <span className="text-[10px] text-zinc-700 shrink-0">+{q.xpReward}</span>
                      )}
                    </div>
                  ))}
                  <p className="text-[10px] text-zinc-700 italic pt-0.5">
                    Complete {currentTierLabel} to unlock
                  </p>
                </div>
              )}
            </div>
          );
        }

        if (isCompleted) {
          const isExpanded = expandedTier === tier;
          return (
            <div key={tier}>
              <div
                className="px-3 py-2 flex items-center gap-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedTier(isExpanded ? null : tier)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/badges/${teamId}_${tier}.png`}
                  alt={tierLabel}
                  width={24}
                  height={24}
                  className="object-contain shrink-0 opacity-40"
                />
                <span className="flex-1 text-sm font-heading text-zinc-500 truncate">{tierLabel}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {isExpanded && total > 0 && (
                <div className="ml-3 pl-3 border-l border-zinc-800 pb-2 flex flex-col gap-1 mt-0.5">
                  {tierQuests.map((q) => (
                    <div key={q.questId} className="flex items-start gap-2 py-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="flex-1 text-[11px] text-zinc-600 leading-snug line-through">{q.name}</span>
                      {q.xpReward > 0 && (
                        <span className="text-[10px] text-zinc-700 shrink-0">+{q.xpReward}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        const isExpanded = expandedTier === tier;
        return (
          <div
            key={tier}
            className="rounded-xl bg-[#16213e] border border-[#27272A] overflow-hidden"
            style={{ borderLeft: `3px solid ${teamColor}` }}
          >
            <div
              className="py-3 pr-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
              style={{ paddingLeft: "0.875rem" }}
              onClick={() => setExpandedTier(isExpanded ? null : tier)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/badges/${teamId}_${tier}.png`}
                alt={tierLabel}
                width={40}
                height={40}
                className="object-contain drop-shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-bold leading-tight truncate" style={{ color: teamColor }}>
                  {tierLabel}
                </p>
                {total > 0 && (
                  <p className="text-xs text-text-muted mt-0.5">{completedCount}/{total} quests</p>
                )}
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {isExpanded && total > 0 && (
              <div className="px-3.5 pb-3 flex flex-col gap-1 border-t border-[#27272A] pt-2.5">
                {tierQuests.map((q) => {
                  const done = completions[q.questId]?.status === "completed";
                  return (
                    <div key={q.questId} className="flex items-start gap-2 py-0.5">
                      {done ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div className="w-[11px] h-[11px] rounded-full border mt-0.5 shrink-0" style={{ borderColor: teamColor }} />
                      )}
                      <span className={`flex-1 text-[11px] leading-snug ${done ? "text-zinc-600 line-through" : "text-zinc-300"}`}>{q.name}</span>
                      {q.xpReward > 0 && (
                        <span className="text-[10px] text-zinc-600 shrink-0">+{q.xpReward}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
