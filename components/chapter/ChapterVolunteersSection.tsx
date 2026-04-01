"use client";

import { TEAM_META } from "@/lib/seed/quests";
import { VolunteerRow } from "./VolunteerRow";
import type { ChapterVolunteer } from "@/types/chapter";

const CHIP_BASE =
  "px-3 py-1 rounded-full text-xs font-heading font-medium border transition-all active:scale-95 flex items-center gap-1.5";
const CHIP_IDLE = "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary";

export function ChapterVolunteersSection({
  volunteers,
  filteredVolunteers,
  pagedVolunteers,
  volunteerPage,
  setVolunteerPage,
  volunteerTotalPages,
  volunteerPageSize,
  search,
  setSearch,
  teamFilter,
  setTeamFilter,
  canEdit,
  currentUserId,
  onRequestRemoveVolunteer,
}: {
  volunteers: ChapterVolunteer[];
  filteredVolunteers: ChapterVolunteer[];
  pagedVolunteers: ChapterVolunteer[];
  volunteerPage: number;
  setVolunteerPage: (n: number | ((p: number) => number)) => void;
  volunteerTotalPages: number;
  volunteerPageSize: number;
  search: string;
  setSearch: (s: string) => void;
  teamFilter: string;
  setTeamFilter: (t: string) => void;
  canEdit: boolean;
  currentUserId?: string;
  onRequestRemoveVolunteer: (uid: string) => void;
}) {
  return (
    <div
      className="flex flex-col gap-4 animate-fade-up order-7 lg:order-none"
      style={{ animationDelay: "200ms" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-heading text-xs text-text-secondary uppercase tracking-widest">
          Volunteers
        </span>
        <span className="text-xs text-text-muted tabular-nums">
          {filteredVolunteers.length}
          {filteredVolunteers.length !== volunteers.length && (
            <> / {volunteers.length}</>
          )}
        </span>
      </div>

      <div className="relative">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search volunteers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-colors"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTeamFilter("all")}
          className={`${CHIP_BASE} ${teamFilter === "all" ? "border-accent-highlight bg-accent-highlight/10 text-accent-highlight" : CHIP_IDLE}`}
        >
          All Roles
        </button>
        {Object.entries(TEAM_META).map(([id, meta]) => {
          const isActive = teamFilter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTeamFilter(id)}
              className={`${CHIP_BASE} ${isActive ? "" : CHIP_IDLE}`}
              style={
                isActive
                  ? {
                      borderColor: meta.color,
                      backgroundColor: `${meta.color}1A`,
                      color: meta.color,
                    }
                  : undefined
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: isActive ? meta.color : "currentColor",
                  opacity: isActive ? 1 : 0.5,
                }}
              />
              {meta.label}
            </button>
          );
        })}
      </div>

      {filteredVolunteers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-border/50 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-sm text-text-muted">
            {volunteers.length === 0
              ? "No volunteers in this chapter yet."
              : "No volunteers match your search."}
          </p>
          {search || teamFilter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTeamFilter("all");
              }}
              className="text-xs text-accent-highlight hover:text-accent-primary transition-colors"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {pagedVolunteers.map((v, i) => (
            <VolunteerRow
              key={`${teamFilter}-${v.uid}`}
              volunteer={v}
              index={(volunteerPage - 1) * volunteerPageSize + i}
              canRemove={canEdit}
              onRemove={onRequestRemoveVolunteer}
              isCurrentUser={v.uid === currentUserId}
            />
          ))}
        </div>
      )}

      {filteredVolunteers.length > volunteerPageSize && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={() => setVolunteerPage((p) => Math.max(1, p - 1))}
            disabled={volunteerPage <= 1}
            className="px-3 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-heading"
          >
            Prev
          </button>
          <span className="text-xs text-text-muted font-sans tabular-nums">
            Page {volunteerPage} of {volunteerTotalPages}
          </span>
          <button
            type="button"
            onClick={() => setVolunteerPage((p) => Math.min(volunteerTotalPages, p + 1))}
            disabled={volunteerPage >= volunteerTotalPages}
            className="px-3 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-heading"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
