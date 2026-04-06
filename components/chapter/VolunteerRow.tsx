"use client";

import Link from "next/link";
import { TEAM_META } from "@/lib/seed/quests";
import { getXpLevelProgress } from "@/lib/xpLevel";
import { ChapterAvatar } from "./ChapterAvatar";
import { TeamBadge } from "./TeamBadge";
import type { ChapterVolunteer } from "@/types/chapter";

export function VolunteerRow({
  volunteer,
  index,
  isCurrentUser,
}: {
  volunteer: ChapterVolunteer;
  index: number;
  isCurrentUser: boolean;
}) {
  const { level } = getXpLevelProgress(volunteer.xp);
  const primaryTeamMeta = volunteer.teams[0] ? TEAM_META[volunteer.teams[0]] : null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors animate-fade-up"
      style={{
        animationDelay: `${index * 35}ms`,
        backgroundColor: isCurrentUser ? "rgba(124,58,237,0.07)" : "transparent",
        borderColor: isCurrentUser ? "rgba(124,58,237,0.25)" : "rgba(39,39,42,0.5)",
      }}
    >
      <Link
        href={`/profile/${volunteer.uid}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <ChapterAvatar username={volunteer.username} opts={volunteer.avatarOptions} size={40} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm text-text-primary truncate">
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

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {volunteer.teams.slice(0, 2).map((t) => (
            <TeamBadge key={t} teamId={t} />
          ))}
          {volunteer.teams.length > 2 && (
            <span className="text-[10px] text-text-muted">+{volunteer.teams.length - 2}</span>
          )}
        </div>

        <div
          className="shrink-0 text-sm font-heading tabular-nums hidden md:block"
          style={{ color: primaryTeamMeta?.color ?? "#A855F7" }}
        >
          +{volunteer.xp.toLocaleString()} XP
        </div>
      </Link>

    </div>
  );
}
