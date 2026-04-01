import { TIER_LABELS, TEAM_META } from "@/lib/seed/quests";
import type { Quest } from "@/types/quest";

export type TeamProgressRow = {
  currentTier: Quest["tier"];
  completed: number;
  total: number;
  pct: number;
  nextLabel: string | null;
  isMaxTier: boolean;
};

export function DashboardTeamProgressSection({
  teamIds,
  teamProgressMap,
  barsReady,
}: {
  teamIds: string[];
  teamProgressMap: Record<string, TeamProgressRow>;
  barsReady: boolean;
}) {
  if (teamIds.length === 0) return null;

  return (
    <div className="order-5 lg:order-none flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
      {teamIds.map((teamId) => {
        const meta = TEAM_META[teamId];
        const prog = teamProgressMap[teamId];
        if (!meta || !prog) return null;
        return (
          <div key={teamId} className="rounded-2xl bg-surface border border-border p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                <span className="font-heading text-sm text-text-primary">{meta.label}</span>
              </div>
              <span
                className="text-[10px] font-heading px-2 py-0.5 rounded-full border uppercase tracking-wide shrink-0"
                style={{ color: meta.color, borderColor: `${meta.color}40`, backgroundColor: `${meta.color}10` }}
              >
                {TIER_LABELS[prog.currentTier]}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-muted font-sans">Quest Progress</span>
                <span className="font-heading tabular-nums" style={{ color: meta.color }}>
                  {prog.completed}/{prog.total}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barsReady ? prog.pct : 0}%`, backgroundColor: meta.color }}
                />
              </div>
            </div>
            {!prog.isMaxTier && prog.nextLabel ? (
              <p className="text-[11px] text-text-muted font-sans">
                Next: <span style={{ color: meta.color }}>{prog.nextLabel}</span>
              </p>
            ) : null}
            {prog.isMaxTier ? (
              <p className="text-[11px] font-sans font-medium" style={{ color: meta.color }}>
                Max tier reached
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
