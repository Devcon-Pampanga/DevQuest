"use client";

import { MissionCompletionStatus } from "@/types/mission";

export function MissionStatusPill({ status }: { status: MissionCompletionStatus | "available" }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    available: { label: "Open", bg: "#06B6D41A", color: "#06B6D4" },
    assigned: { label: "Assigned", bg: "#A855F71A", color: "#A855F7" },
    joined: { label: "In Progress", bg: "#F5C5181A", color: "#F5C518" },
    submitted: { label: "Pending Review", bg: "#F974161A", color: "#F97316" },
    completed: { label: "Completed", bg: "#22C55E1A", color: "#22C55E" },
  };
  const s = map[status] ?? map.available;
  return (
    <span
      className="text-[10px] font-heading font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
