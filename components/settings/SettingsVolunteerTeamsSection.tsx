"use client";

import { TEAM_META } from "@/lib/seed/quests";

const ALL_TEAM_IDS = Object.keys(TEAM_META);

export function SettingsVolunteerTeamsSection({
  currentTeams,
  teamLoading,
  onLeaveTeam,
  onJoinTeam,
}: {
  currentTeams: string[];
  teamLoading: string | null;
  onLeaveTeam: (teamId: string) => void | Promise<void>;
  onJoinTeam: (teamId: string) => void | Promise<void>;
}) {
  return (
    <section className="order-2 lg:order-none rounded-2xl border border-border bg-surface overflow-hidden animate-fade-up" style={{ animationDelay: "60ms" }}>
      <div className="px-5 py-3 border-b border-border">
        <span className="font-heading text-sm text-text-primary">Volunteer Teams</span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-3">
        <p className="text-xs text-text-muted font-sans">
          You must be on at least one team. Leaving a team preserves your quest progress if you rejoin later.
        </p>
        {ALL_TEAM_IDS.map((teamId) => {
          const meta = TEAM_META[teamId];
          const isMember = currentTeams.includes(teamId);
          const isOnly = isMember && currentTeams.length === 1;
          const isLoading = teamLoading === teamId;
          return (
            <div
              key={teamId}
              className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3"
              style={isMember ? { borderColor: `${meta.color}44`, backgroundColor: `${meta.color}0a` } : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-sans text-text-primary truncate">{meta.label}</p>
                  {isMember ? (
                    <p className="text-[10px] font-sans text-text-muted mt-0.5">Member</p>
                  ) : null}
                </div>
              </div>
              {isMember ? (
                <button
                  type="button"
                  onClick={() => void onLeaveTeam(teamId)}
                  disabled={isOnly || isLoading}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs font-sans text-text-muted hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={isOnly ? "You must remain on at least one team" : undefined}
                >
                  {isLoading ? "Leaving…" : "Leave"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void onJoinTeam(teamId)}
                  disabled={isLoading}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-sans transition-colors disabled:opacity-50"
                  style={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: `${meta.color}55`,
                    backgroundColor: `${meta.color}14`,
                    color: meta.color,
                  }}
                >
                  {isLoading ? "Joining…" : "Join"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
