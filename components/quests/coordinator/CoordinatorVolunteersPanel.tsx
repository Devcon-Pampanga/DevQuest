"use client";

import { useState, useMemo } from "react";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import { TEAM_META } from "@/lib/seed/quests";
import type { VolunteerWithTier } from "@/hooks/useCoordinatorHubData";

const TIER_LABELS: Record<string, string> = {
  team_member: "Member",
  associate: "Associate",
  specialist: "Specialist",
  lead: "Lead",
};

const TIER_COLORS: Record<string, string> = {
  team_member: "#52525B",
  associate: "#06B6D4",
  specialist: "#A855F7",
  lead: "#F5C518",
};

const ALL_TEAMS = Object.keys(TEAM_META);

interface CoordinatorVolunteersPanelProps {
  volunteers: VolunteerWithTier[];
}

function VolunteerRow({ volunteer }: { volunteer: VolunteerWithTier }) {
  const avatarUrl = buildAvatarUrl(
    volunteer.username,
    volunteer.avatarOptions ?? DEFAULT_AVATAR
  );
  const tier = volunteer.highestTier;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
      {/* Avatar */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt={volunteer.username}
        width={32}
        height={32}
        className="rounded-lg border border-border shrink-0"
      />

      {/* Name + teams */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-heading text-text-primary leading-tight truncate capitalize">
          {volunteer.username}
        </p>
        <div className="flex items-center gap-1 flex-wrap mt-0.5">
          {volunteer.teams.length === 0 ? (
            <span className="text-[10px] text-text-muted">No team</span>
          ) : (
            volunteer.teams.map((teamId) => {
              const meta = TEAM_META[teamId];
              if (!meta) return null;
              return (
                <span
                  key={teamId}
                  className="text-[10px] font-heading px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${meta.color}1A`,
                    color: meta.color,
                  }}
                >
                  {meta.label}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* Tier badge */}
      {tier && tier !== "team_member" ? (
        <span
          className="text-[10px] font-heading px-2 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: `${TIER_COLORS[tier]}1A`,
            color: TIER_COLORS[tier],
          }}
        >
          {TIER_LABELS[tier]}
        </span>
      ) : (
        <span className="text-[10px] text-text-muted shrink-0">Member</span>
      )}
    </div>
  );
}

export function CoordinatorVolunteersPanel({ volunteers }: CoordinatorVolunteersPanelProps) {
  const [search, setSearch] = useState("");
  const [activeTeam, setActiveTeam] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    let list = volunteers;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((v) => v.username.toLowerCase().includes(q));
    }
    if (activeTeam !== "all") {
      list = list.filter((v) => v.teams.includes(activeTeam));
    }
    return list;
  }, [volunteers, search, activeTeam]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleTeamChange(team: string) {
    setActiveTeam(team);
    setPage(1);
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  return (
    <div
      className="lg:col-span-2 rounded-2xl border border-border overflow-hidden animate-fade-up flex flex-col"
      style={{ backgroundColor: "#1e1a2e", animationDelay: "80ms" }}
    >
      {/* Top bar */}
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #7C3AED, #A855F7)" }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-heading text-base font-bold text-text-primary leading-tight">VOLUNTEERS</p>
            <p className="text-xs text-text-muted mt-0.5">
              {filtered.length} of {volunteers.length} member{volunteers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#52525B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-highlight"
            placeholder="Search by username…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Team filter chips */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <button
            type="button"
            onClick={() => handleTeamChange("all")}
            className="text-xs font-heading px-3 py-1 rounded-full border transition-colors"
            style={{
              borderColor: activeTeam === "all" ? "#A855F7" : "#27272A",
              backgroundColor: activeTeam === "all" ? "#A855F71A" : "transparent",
              color: activeTeam === "all" ? "#A855F7" : "#A1A1AA",
            }}
          >
            All
          </button>
          {ALL_TEAMS.map((teamId) => {
            const meta = TEAM_META[teamId];
            const isActive = activeTeam === teamId;
            return (
              <button
                key={teamId}
                type="button"
                onClick={() => handleTeamChange(teamId)}
                className="text-xs font-heading px-3 py-1 rounded-full border transition-colors"
                style={{
                  borderColor: isActive ? meta.color : "#27272A",
                  backgroundColor: isActive ? `${meta.color}1A` : "transparent",
                  color: isActive ? meta.color : "#A1A1AA",
                }}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Volunteer list */}
        {paginated.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-text-secondary text-xs font-heading">No volunteers found</p>
          </div>
        ) : (
          <div className="flex flex-col -mx-1">
            {paginated.map((v) => (
              <VolunteerRow key={v.uid} volunteer={v} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-heading"
            >
              Prev
            </button>
            <span className="text-xs text-text-muted font-sans tabular-nums">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-heading"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
