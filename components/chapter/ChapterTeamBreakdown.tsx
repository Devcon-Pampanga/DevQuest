"use client";

import { TEAM_META } from "@/lib/seed/quests";
import type { ChapterVolunteer } from "@/types/chapter";

export function ChapterTeamBreakdown({ volunteers }: { volunteers: ChapterVolunteer[] }) {
  const teamBreakdown = Object.entries(TEAM_META).map(([id, meta]) => {
    const total = Math.max(1, volunteers.length);
    const count = volunteers.filter((v) => v.teams.includes(id)).length;
    return { id, meta, count, pct: Math.round((count / total) * 100) };
  });

  return (
    <div
      className="rounded-2xl bg-surface border border-border p-5 flex flex-col gap-4 animate-fade-up order-6 lg:order-none"
      style={{ animationDelay: "220ms" }}
    >
      <span className="font-heading text-sm text-text-primary uppercase tracking-widest">
        Team Breakdown
      </span>

      <div className="flex flex-col gap-3.5">
        {teamBreakdown.map(({ id, meta, count, pct }) => (
          <div key={id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-sans">{meta.label}</span>
              <span
                className="font-heading tabular-nums"
                style={{ color: meta.color }}
              >
                {count > 0 ? `${pct}%` : "—"}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: meta.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-text-muted">
        Volunteers per team · {volunteers.length} total
      </p>
    </div>
  );
}
