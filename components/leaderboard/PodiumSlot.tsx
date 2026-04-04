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
  const mobileAvatarSize = rank === 1 ? 64 : rank === 2 ? 50 : 44;
  const avatarResponsiveClassName =
    rank === 1
      ? "sm:w-[72px] sm:h-[72px]"
      : rank === 2
        ? "sm:w-[56px] sm:h-[56px]"
        : "sm:w-[48px] sm:h-[48px]";
  const delay = rank === 1 ? 120 : rank === 2 ? 60 : 0;
  const primaryTeamMeta = volunteer?.teams[0] ? TEAM_META[volunteer.teams[0]] : null;

  if (!volunteer) {
    return (
      <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-1 sm:gap-3">
        <div
          className="rounded-xl bg-border/20 animate-pulse"
          style={{ width: mobileAvatarSize, height: mobileAvatarSize }}
        />
        <div className="w-full px-1 text-center">
          <SkeletonLine className="mx-auto w-full max-w-[5rem]" />
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
      className="flex min-w-0 flex-col items-center animate-fade-up sm:flex-1"
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
          className={`relative rounded-xl object-cover border-2 ${avatarResponsiveClassName}`}
          style={{
            borderColor: color,
            width: mobileAvatarSize,
            height: mobileAvatarSize,
            minWidth: mobileAvatarSize,
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

      <div className="mt-1 mb-2 w-full px-1 text-center sm:mb-3">
        <Link
          href={`/profile/${volunteer.uid}`}
          className="block w-full truncate font-heading text-xs text-text-primary transition-colors hover:text-accent-highlight sm:mx-auto sm:max-w-[96px] sm:text-sm"
        >
          {volunteer.username}
        </Link>
        {isCurrentUser && (
          <span className="mt-0.5 inline-block rounded-full bg-accent-primary/20 px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-accent-highlight font-sans sm:text-[9px]">
            you
          </span>
        )}
        <div
          className="mt-0.5 font-heading text-xs tabular-nums sm:text-sm"
          style={{ color: primaryTeamMeta?.color ?? color }}
        >
          {volunteer.xp.toLocaleString()} XP
        </div>
        {volunteer.teams[0] && (
          <div
            className="mt-1 inline-flex max-w-full items-center justify-center rounded-full px-1.5 py-0.5 text-[8px] font-heading font-semibold uppercase tracking-wide sm:px-2 sm:text-[9px]"
            style={{
              backgroundColor: (primaryTeamMeta?.color ?? color) + "20",
              color: primaryTeamMeta?.color ?? color,
            }}
          >
            <span className="line-clamp-2 break-words text-center">{primaryTeamMeta?.label ?? ""}</span>
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
