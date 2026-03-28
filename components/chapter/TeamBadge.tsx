"use client";

import { TEAM_META } from "@/lib/seed/quests";

export function TeamBadge({ teamId }: { teamId: string }) {
  const meta = TEAM_META[teamId];
  if (!meta) return null;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wide whitespace-nowrap"
      style={{
        backgroundColor: meta.color + "22",
        color: meta.color,
        border: `1px solid ${meta.color}44`,
      }}
    >
      {meta.label}
    </span>
  );
}
