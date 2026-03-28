"use client";

import Link from "next/link";
import { SkeletonLine } from "@/components/layout/PageShell";
import { TEAM_META } from "@/lib/seed/quests";
import { getXpLevelProgress } from "@/lib/xpLevel";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { AVATAR_SIZES, MEDAL_COLORS, PODIUM_HEIGHTS } from "@/lib/leaderboardConstants";
import type { ChapterVolunteer } from "@/types/chapter";

export function PodiumSlot({
  volunteer,
  rank,
  isCurrentUser,
}: {
  volunteer: ChapterVolunteer | undefined;
  rank: 1 | 2 | 3;
  isCurrentUser: boolean;
}) {
  const color = MEDAL_COLORS[rank];
  const blockH = PODIUM_HEIGHTS[rank];
  const avatarSize = AVATAR_SIZES[rank];
  const delay = rank === 1 ? 120 : rank === 2 ? 60 : 0;
  const primaryTeamMeta = volunteer?.teams[0] ? TEAM_META[volunteer.teams[0]] : null;

  if (!volunteer) {
    return (
      <div className="flex flex-col items-center gap-3 flex-1">
        <div
          className="rounded-xl bg-border/20 animate-pulse"
          style={{ width: avatarSize, height: avatarSize }}
        />
        <div className="text-center">
          <SkeletonLine className="w-20 mx-auto" />
        </div>
        <div
          className="w-full rounded-t-xl"
          style={{
            height: blockH,
            background: `${color}08`,
            borderTop: `2px solid ${color}15`,
          }}
        />
      </div>
    );
  }

  const { level } = getXpLevelProgress(volunteer.xp);
  const avatarUrl = buildAvatarUrl(volunteer.username, volunteer.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div
      className="flex flex-col items-center flex-1 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative mb-3">
        <div
          className="absolute inset-0 rounded-xl blur-md opacity-40"
          style={{ backgroundColor: color, transform: "scale(1.15)" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={volunteer.username}
          width={avatarSize}
          height={avatarSize}
          className="relative rounded-xl object-cover border-2"
          style={{
            borderColor: color,
            width: avatarSize,
            height: avatarSize,
            minWidth: avatarSize,
          }}
        />
        <div
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-base flex items-center justify-center shadow-lg"
          style={{ backgroundColor: color }}
        >
          {rank === 1 ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ) : (
            <span className="font-heading text-[10px] text-white font-bold">{rank}</span>
          )}
        </div>
      </div>

      <div className="text-center mt-1 mb-3 px-1">
        <Link
          href={`/profile/${volunteer.username}`}
          className="font-heading text-sm text-text-primary hover:text-accent-highlight transition-colors truncate block max-w-[96px]"
        >
          {volunteer.username}
        </Link>
        {isCurrentUser && (
          <span className="inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans uppercase tracking-wide mt-0.5">
            you
          </span>
        )}
        <div
          className="font-heading text-sm tabular-nums mt-0.5"
          style={{ color: primaryTeamMeta?.color ?? color }}
        >
          {volunteer.xp.toLocaleString()} XP
        </div>
        {volunteer.teams[0] && (
          <div
            className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-heading font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: (primaryTeamMeta?.color ?? color) + "20",
              color: primaryTeamMeta?.color ?? color,
            }}
          >
            {primaryTeamMeta?.label ?? ""}
          </div>
        )}
      </div>

      <div
        className="w-full rounded-t-xl flex items-end justify-center pb-2"
        style={{
          height: blockH,
          background: `linear-gradient(to bottom, ${color}20, ${color}08)`,
          borderTop: `2px solid ${color}50`,
        }}
      >
        <span className="text-[10px] font-sans text-text-muted tabular-nums">Lvl {level}</span>
      </div>
    </div>
  );
}
