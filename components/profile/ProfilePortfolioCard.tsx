"use client";

import { useMemo } from "react";
import { Quest, QuestCompletion } from "@/types/quest";

export function ProfilePortfolioCard({
  completions,
  allQuests,
  eventCount,
  reflectionCount,
  badgesEarned,
  onCopyShare,
  copied,
}: {
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
  eventCount: number;
  reflectionCount: number;
  badgesEarned: number;
  onCopyShare: () => void;
  copied: boolean;
}) {
  const verified = useMemo(() => {
    const rows: { questId: string; name: string }[] = [];
    for (const q of allQuests) {
      const c = completions[q.questId];
      if (c?.status === "completed" && c.approvedBy) {
        rows.push({ questId: q.questId, name: q.name });
      }
    }
    return rows;
  }, [allQuests, completions]);

  const show = verified.slice(0, 3);
  const more = Math.max(0, verified.length - 3);

  return (
    <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col gap-5">
      <h3 className="font-heading text-lg text-text-primary">Volunteer milestones</h3>
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Verified milestones</p>
        {verified.length === 0 ? (
          <p className="text-sm text-text-muted font-sans">None yet — complete coordinator-approved quests.</p>
        ) : (
          <ul className="text-sm text-text-primary font-sans space-y-1.5">
            {show.map((v) => (
              <li key={v.questId} className="flex gap-2">
                <span className="text-accent-highlight shrink-0">✓</span>
                <span>{v.name}</span>
              </li>
            ))}
            {more > 0 && <li className="text-text-muted text-xs">+ {more} more</li>}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-[#0a0a0f] border border-border py-2 px-1">
          <p className="text-lg font-heading text-[#06B6D4] tabular-nums" style={{ animation: "count-pulse 600ms cubic-bezier(0.16, 1, 0.3, 1) 350ms 1 both" }}>{eventCount}</p>
          <p className="text-[10px] text-text-muted font-sans leading-tight">Events contributed</p>
        </div>
        <div className="rounded-lg bg-[#0a0a0f] border border-border py-2 px-1">
          <p className="text-lg font-heading text-[#FACC15] tabular-nums" style={{ animation: "count-pulse 600ms cubic-bezier(0.16, 1, 0.3, 1) 450ms 1 both" }}>{reflectionCount}</p>
          <p className="text-[10px] text-text-muted font-sans leading-tight">Reflections</p>
        </div>
        <div className="rounded-lg bg-[#0a0a0f] border border-border py-2 px-1">
          <p className="text-lg font-heading text-[#A855F7] tabular-nums" style={{ animation: "count-pulse 600ms cubic-bezier(0.16, 1, 0.3, 1) 550ms 1 both" }}>{badgesEarned}</p>
          <p className="text-[10px] text-text-muted font-sans leading-tight">Badges earned</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCopyShare}
        className="w-full py-3 rounded-xl font-heading font-semibold bg-accent-highlight text-white hover:bg-accent-primary transition-colors"
      >
        <span key={copied ? "copied" : "share"} style={copied ? { animation: "pop 250ms cubic-bezier(0.16, 1, 0.3, 1) both", display: "inline-block" } : undefined}>
          {copied ? "Copied!" : "Copy Share Link"}
        </span>
      </button>
    </div>
  );
}
