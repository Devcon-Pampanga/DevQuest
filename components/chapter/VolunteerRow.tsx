"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { TEAM_META } from "@/lib/seed/quests";
import { getXpLevelProgress } from "@/lib/xpLevel";
import { useDismissOnOutsideClick } from "@/hooks/useDismissOnOutsideClick";
import { ChapterAvatar } from "./ChapterAvatar";
import { TeamBadge } from "./TeamBadge";
import type { ChapterVolunteer } from "@/types/chapter";

export function VolunteerRow({
  volunteer,
  index,
  canRemove,
  onRemove,
  isCurrentUser,
}: {
  volunteer: ChapterVolunteer;
  index: number;
  canRemove: boolean;
  onRemove: (uid: string) => void;
  isCurrentUser: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { level } = getXpLevelProgress(volunteer.xp);
  const primaryTeamMeta = volunteer.teams[0] ? TEAM_META[volunteer.teams[0]] : null;

  useDismissOnOutsideClick(menuRef, menuOpen, setMenuOpen);

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
        href={`/profile/${volunteer.username}`}
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

      {canRemove && volunteer.role !== "coordinator" && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            aria-label="Volunteer options"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 rounded-xl border border-border bg-elevated py-1 min-w-[160px] animate-modal-in shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRemove(volunteer.uid);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Remove volunteer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
