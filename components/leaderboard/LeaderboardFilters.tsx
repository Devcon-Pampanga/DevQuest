"use client";

import { TEAM_META } from "@/lib/seed/quests";

const CHIP_BASE =
  "px-3 py-1 rounded-full text-xs font-heading font-medium border transition-all active:scale-95 flex items-center gap-1.5";
const CHIP_IDLE = "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary";

export function LeaderboardFilters({
  seasonTab,
  setSeasonTab,
  teamFilter,
  setTeamFilter,
  filteredCount,
}: {
  seasonTab: "season" | "all-time";
  setSeasonTab: (t: "season" | "all-time") => void;
  teamFilter: string;
  setTeamFilter: (t: string) => void;
  filteredCount: number;
}) {
  return (
    <div className="flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "40ms" }}>
      <div className="flex rounded-xl bg-surface border border-border p-1 gap-1 w-fit">
        {(["season", "all-time"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSeasonTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-heading font-medium transition-colors capitalize ${
              seasonTab === tab
                ? "bg-accent-highlight text-white"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tab === "season" ? "Season 1" : "All-Time"}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTeamFilter("all")}
          className={`${CHIP_BASE} ${teamFilter === "all" ? "border-accent-highlight bg-accent-highlight/10 text-accent-highlight" : CHIP_IDLE}`}
        >
          All Teams
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

      {teamFilter !== "all" && (
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: TEAM_META[teamFilter]?.color }}
          />
          <span className="text-xs text-text-muted">
            Showing{" "}
            <span
              className="font-medium"
              style={{ color: TEAM_META[teamFilter]?.color }}
            >
              {TEAM_META[teamFilter]?.label}
            </span>{" "}
            volunteers only · {filteredCount} member
            {filteredCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
