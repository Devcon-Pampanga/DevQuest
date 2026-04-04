"use client";

import Link from "next/link";
import { TEAM_META } from "@/lib/seed/quests";
import { MEDAL_COLORS, MEDAL_LABELS } from "@/lib/chapterConstants";
import { ChapterAvatar } from "./ChapterAvatar";
import type { ChapterVolunteer } from "@/types/chapter";

export function LeaderboardItem({
  volunteer,
  rank,
  isCurrentUser,
  index,
}: {
  volunteer: ChapterVolunteer;
  rank: number;
  isCurrentUser: boolean;
  index: number;
}) {
  const isTopThree = rank <= 3;
  const medalColor = MEDAL_COLORS[rank - 1];
  const primaryTeamMeta = volunteer.teams[0] ? TEAM_META[volunteer.teams[0]] : null;

  if (isTopThree) {
    return (
      <div
        className="rounded-xl p-3 flex items-center gap-3 border animate-fade-up"
        style={{
          animationDelay: `${index * 40}ms`,
          backgroundColor: isCurrentUser
            ? "rgba(124,58,237,0.1)"
            : `${medalColor}12`,
          borderColor: isCurrentUser
            ? "rgba(124,58,237,0.35)"
            : `${medalColor}2e`,
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: medalColor + "20" }}
        >
          {rank === 1 ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill={medalColor} stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ) : (
            <span
              className="font-heading text-sm font-bold"
              style={{ color: medalColor }}
            >
              {rank}
            </span>
          )}
        </div>

        <Link
          href={`/profile/${volunteer.uid}`}
          className="flex items-center gap-2.5 flex-1 min-w-0"
        >
          <ChapterAvatar
            username={volunteer.username}
            opts={volunteer.avatarOptions}
            size={34}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-sm text-text-primary truncate">
                {volunteer.username}
              </span>
              {isCurrentUser && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans uppercase tracking-wide shrink-0">
                  you
                </span>
              )}
            </div>
            <div
              className="text-[9px] font-sans uppercase tracking-widest mt-0.5"
              style={{ color: medalColor + "99" }}
            >
              {MEDAL_LABELS[rank - 1]}
            </div>
          </div>
        </Link>

        <div
          className="shrink-0 font-heading text-sm tabular-nums"
          style={{ color: primaryTeamMeta?.color ?? "#A855F7" }}
        >
          {volunteer.xp.toLocaleString()} XP
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-2 py-2 rounded-xl border animate-fade-up"
      style={{
        animationDelay: `${index * 30}ms`,
        backgroundColor: isCurrentUser ? "rgba(124,58,237,0.07)" : "transparent",
        borderColor: isCurrentUser ? "rgba(124,58,237,0.25)" : "transparent",
      }}
    >
      <span className="w-5 text-center text-xs text-text-muted font-heading tabular-nums shrink-0">
        {rank}
      </span>
      <Link
        href={`/profile/${volunteer.uid}`}
        className="flex items-center gap-2.5 flex-1 min-w-0"
      >
        <ChapterAvatar
          username={volunteer.username}
          opts={volunteer.avatarOptions}
          size={30}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-sm text-text-primary truncate">
              {volunteer.username}
            </span>
            {isCurrentUser && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans uppercase tracking-wide shrink-0">
                you
              </span>
            )}
          </div>
        </div>
      </Link>
      <span className="shrink-0 text-sm text-text-secondary font-heading tabular-nums">
        {volunteer.xp.toLocaleString()} XP
      </span>
    </div>
  );
}
