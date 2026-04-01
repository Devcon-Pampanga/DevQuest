"use client";

import { TEAM_META } from "@/lib/seed/quests";
import { getXpLevelProgress } from "@/lib/xpLevel";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { MEDAL_COLORS } from "@/lib/leaderboardConstants";
import type { ChapterVolunteer } from "@/types/chapter";

export function YourRankCard({
  volunteer,
  rank,
  total,
  xpToNext,
}: {
  volunteer: ChapterVolunteer;
  rank: number;
  total: number;
  xpToNext: number;
}) {
  const primaryTeamMeta = volunteer.teams[0] ? TEAM_META[volunteer.teams[0]] : null;
  const color = primaryTeamMeta?.color ?? "#A855F7";
  const { pctToNextLevel } = getXpLevelProgress(volunteer.xp);
  const avatarUrl = buildAvatarUrl(volunteer.username, volunteer.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div
      className="rounded-2xl border p-4 flex items-center gap-4 animate-fade-up relative overflow-hidden"
      style={{
        borderColor: color + "40",
        background: `linear-gradient(135deg, ${color}0d 0%, transparent 60%)`,
        animationDelay: "0ms",
      }}
    >
      <div
        className="absolute -top-8 -left-8 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className="shrink-0 text-center min-w-[48px]">
        <div
          className="font-heading text-3xl tabular-nums leading-none"
          style={{ color }}
        >
          #{rank}
        </div>
        <div className="text-[10px] text-text-muted font-sans mt-0.5">
          of {total}
        </div>
      </div>

      <div className="w-px h-10 shrink-0" style={{ backgroundColor: color + "30" }} />

      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={volunteer.username}
          width={40}
          height={40}
          className="rounded-xl border shrink-0 object-cover"
          style={{ borderColor: color + "50" }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-sm text-text-primary truncate">
              {volunteer.username}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans uppercase tracking-wide shrink-0">
              you
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pctToNextLevel}%`, backgroundColor: color }}
              />
            </div>
            <span
              className="text-[10px] font-heading tabular-nums shrink-0"
              style={{ color }}
            >
              {volunteer.xp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      {rank > 1 && xpToNext > 0 && (
        <div className="shrink-0 text-right hidden sm:block">
          <div className="text-[10px] text-text-muted font-sans leading-tight">
            {xpToNext.toLocaleString()} XP
          </div>
          <div className="text-[10px] text-text-muted font-sans leading-tight">
            to #{rank - 1}
          </div>
        </div>
      )}
      {rank === 1 && (
        <div
          className="shrink-0 text-[10px] font-sans uppercase tracking-wide hidden sm:block"
          style={{ color: MEDAL_COLORS[1] }}
        >
          #1 · Top rank
        </div>
      )}
    </div>
  );
}
