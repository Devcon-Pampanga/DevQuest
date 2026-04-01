"use client";

import { TEAM_META } from "@/lib/seed/quests";

export function LeaderboardEmptyState({
  teamFilter,
  onViewAllTeams,
}: {
  teamFilter: string;
  onViewAllTeams: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-border/30 flex items-center justify-center animate-float">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="font-heading text-lg text-text-primary">No volunteers found</p>
        <p className="text-sm text-text-secondary">
          {teamFilter !== "all"
            ? `No ${TEAM_META[teamFilter]?.label} members in this chapter yet.`
            : "No volunteers in this chapter yet."}
        </p>
      </div>
      {teamFilter !== "all" && (
        <button
          type="button"
          onClick={onViewAllTeams}
          className="text-sm text-accent-highlight hover:text-accent-primary transition-colors"
        >
          View all teams
        </button>
      )}
    </div>
  );
}
