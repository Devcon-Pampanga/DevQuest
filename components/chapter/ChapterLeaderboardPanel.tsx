"use client";

import { useState } from "react";
import Link from "next/link";
import { shortChapter } from "@/lib/chapterConstants";
import { LeaderboardItem } from "./LeaderboardItem";
import type { ChapterVolunteer } from "@/types/chapter";

export function ChapterLeaderboardPanel({
  viewingChapterId,
  leaderboard,
  currentUserId,
  displayLimit = 10,
  showCurrentUserOutsideLimit = false,
}: {
  viewingChapterId: string;
  leaderboard: ChapterVolunteer[];
  currentUserId?: string;
  displayLimit?: number;
  showCurrentUserOutsideLimit?: boolean;
}) {
  const [leaderboardTab, setLeaderboardTab] = useState<"chapter" | "all-time">("chapter");
  const visibleLeaderboard = leaderboard.slice(0, displayLimit);
  const currentUserRank =
    currentUserId ? leaderboard.findIndex((v) => v.uid === currentUserId) + 1 : 0;
  const currentUserOutsideLimit =
    showCurrentUserOutsideLimit &&
    currentUserRank > displayLimit &&
    currentUserId !== undefined;
  const currentUserVolunteer = currentUserOutsideLimit
    ? leaderboard[currentUserRank - 1]
    : undefined;
  const remainingCount = Math.max(leaderboard.length - displayLimit, 0);

  return (
    <div
      className="rounded-2xl bg-surface border border-border p-5 flex flex-col gap-4 animate-fade-up order-4 lg:order-none"
      style={{ animationDelay: "180ms" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#F5C518" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="font-heading text-sm text-text-primary uppercase tracking-widest">
            Leaderboard
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30 text-yellow-400/60 font-sans uppercase tracking-wide">
          Season 1
        </span>
      </div>

      <div className="flex rounded-xl bg-elevated p-1 gap-1">
        {(["chapter", "all-time"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setLeaderboardTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-heading font-medium transition-colors ${
              leaderboardTab === tab
                ? "bg-accent-highlight text-white"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tab === "chapter" ? "Chapter" : "All-Time"}
          </button>
        ))}
      </div>

      {leaderboard.length > 0 && (
        <p className="text-[11px] text-text-muted -mt-1">
          {shortChapter(viewingChapterId)} · {leaderboard.length} volunteer
          {leaderboard.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            No volunteers yet.
          </div>
        ) : (
          visibleLeaderboard.map((v, i) => (
            <div
              key={v.uid}
              className={displayLimit === 10
                ? i >= 8
                  ? "hidden lg:block"
                  : i >= 5
                    ? "hidden sm:block"
                    : undefined
                : undefined}
            >
              <LeaderboardItem
                volunteer={v}
                rank={i + 1}
                isCurrentUser={v.uid === currentUserId}
                index={i}
              />
            </div>
          ))
        )}
      </div>

      {currentUserOutsideLimit && currentUserVolunteer ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-border/70" />
            <span className="text-[10px] font-heading uppercase tracking-[0.24em] text-text-muted">
              Your Rank
            </span>
            <div className="flex-1 h-px bg-border/70" />
          </div>
          <LeaderboardItem
            volunteer={currentUserVolunteer}
            rank={currentUserRank}
            isCurrentUser
            index={displayLimit}
          />
        </div>
      ) : null}

      {displayLimit === 10 && leaderboard.length > 8 && (
        <Link
          href={`/leaderboard?chapter=${encodeURIComponent(viewingChapterId)}`}
          className="hidden sm:block lg:hidden text-center text-xs text-text-muted hover:text-accent-highlight transition-colors"
        >
          +{leaderboard.length - 8} more volunteers
        </Link>
      )}
      {displayLimit === 10 && leaderboard.length > 5 && (
        <Link
          href={`/leaderboard?chapter=${encodeURIComponent(viewingChapterId)}`}
          className="sm:hidden text-center text-xs text-text-muted hover:text-accent-highlight transition-colors"
        >
          +{leaderboard.length - 5} more volunteers
        </Link>
      )}
      {displayLimit === 10 && leaderboard.length > 10 && (
        <Link
          href={`/leaderboard?chapter=${encodeURIComponent(viewingChapterId)}`}
          className="hidden lg:block text-center text-xs text-text-muted hover:text-accent-highlight transition-colors"
        >
          +{leaderboard.length - 10} more volunteers
        </Link>
      )}
      {displayLimit !== 10 && remainingCount > 0 ? (
        <Link
          href={`/leaderboard?chapter=${encodeURIComponent(viewingChapterId)}`}
          className="text-center text-xs text-text-muted hover:text-accent-highlight transition-colors"
        >
          +{remainingCount} more volunteers
        </Link>
      ) : null}

      <Link
        href={`/leaderboard?chapter=${encodeURIComponent(viewingChapterId)}`}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-accent-primary/40 bg-accent-primary/10 hover:bg-accent-primary/20 hover:border-accent-primary/60 text-accent-highlight text-xs font-heading font-semibold transition-all group"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        View Full Leaderboard
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-150">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    </div>
  );
}
