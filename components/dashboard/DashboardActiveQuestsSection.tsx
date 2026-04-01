import Link from "next/link";
import type { Quest } from "@/types/quest";
import { TEAM_META } from "@/lib/seed/quests";

export function DashboardActiveQuestsSection({
  activeQuestCards,
  primaryTeamId,
  teamColor,
}: {
  activeQuestCards: Quest[];
  primaryTeamId: string;
  teamColor: string;
}) {
  const primaryMeta = primaryTeamId ? TEAM_META[primaryTeamId] : undefined;

  return (
    <section className="order-6 lg:order-none animate-fade-up" style={{ animationDelay: "120ms" }}>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-heading text-xl text-text-primary">Active quests</h2>
        <Link href="/quests" className="text-xs font-heading text-accent-highlight hover:text-text-primary transition-colors" aria-label="View all quests">
          View all
        </Link>
      </div>
      {activeQuestCards.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-8 flex flex-col items-center gap-3 text-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
            aria-hidden
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <div>
            <p className="font-heading text-sm text-text-primary mb-1">No active quests yet</p>
            <p className="text-xs text-text-muted font-sans max-w-[22ch] mx-auto">
              Complete your team&apos;s associate-tier quests to advance your career path.
            </p>
          </div>
          <Link
            href="/quests"
            className="inline-flex items-center justify-center border border-border rounded-xl px-4 py-2 text-xs font-heading text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors"
          >
            Browse Quests
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {activeQuestCards.map((q, i) => (
            <Link
              key={q.questId}
              href="/quests"
              className="rounded-2xl border border-border bg-surface p-4 hover:border-accent-primary/50 hover:scale-[1.01] transition-[transform,border-color] flex flex-col gap-2.5 animate-fade-up"
              style={{ animationDelay: `${180 + i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-heading text-base text-text-primary leading-snug">{q.name}</p>
                <span
                  className="shrink-0 text-xs font-heading tabular-nums px-2 py-0.5 rounded-lg whitespace-nowrap"
                  style={{ color: teamColor, backgroundColor: `${teamColor}18` }}
                >
                  +{q.xpReward} XP
                </span>
              </div>
              <p className="text-xs text-text-muted font-sans line-clamp-2 flex-1">{q.description}</p>
              <div className="flex items-center gap-2 pt-2.5 border-t border-border mt-auto">
                <span className="text-[10px] font-sans uppercase tracking-widest" style={{ color: teamColor }}>
                  {primaryMeta?.label}
                </span>
                <span className="text-text-muted text-xs select-none">·</span>
                <span className="text-[10px] text-text-muted font-sans">
                  {q.completionMethod.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
