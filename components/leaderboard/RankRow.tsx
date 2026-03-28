"use client";

import Link from "next/link";
import { TEAM_META } from "@/lib/seed/quests";
import { getXpLevelProgress } from "@/lib/xpLevel";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { TeamBadge } from "@/components/chapter/TeamBadge";
import type { ChapterVolunteer } from "@/types/chapter";

export function RankRow({
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
  const { level } = getXpLevelProgress(volunteer.xp);
  const primaryTeamMeta = volunteer.teams[0] ? TEAM_META[volunteer.teams[0]] : null;
  const avatarUrl = buildAvatarUrl(volunteer.username, volunteer.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors animate-fade-up group"
      style={{
        animationDelay: `${180 + index * 30}ms`,
        backgroundColor: isCurrentUser ? "rgba(124,58,237,0.07)" : "transparent",
        borderColor: isCurrentUser ? "rgba(124,58,237,0.25)" : "rgba(39,39,42,0.5)",
      }}
    >
      <span className="w-7 text-right text-sm text-text-muted font-heading tabular-nums shrink-0">
        {rank}
      </span>

      <Link
        href={`/profile/${volunteer.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={volunteer.username}
          width={36}
          height={36}
          className="rounded-xl border border-border object-cover shrink-0 group-hover:border-accent-primary/40 transition-colors"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm text-text-primary truncate group-hover:text-accent-highlight transition-colors">
              {volunteer.username}
            </span>
            {isCurrentUser && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans uppercase tracking-wide shrink-0">
                you
              </span>
            )}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5">Lvl {level}</div>
        </div>
      </Link>

      {volunteer.teams[0] && (
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <TeamBadge teamId={volunteer.teams[0]} />
        </div>
      )}

      <span
        className="shrink-0 text-sm font-heading tabular-nums"
        style={{ color: primaryTeamMeta?.color ?? "#A855F7" }}
      >
        {volunteer.xp.toLocaleString()} XP
      </span>
    </div>
  );
}
