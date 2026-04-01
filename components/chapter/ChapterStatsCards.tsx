"use client";

import { ChapterStatCard } from "./ChapterStatCard";

const iconCalendar = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const iconVolunteers = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const iconActivity = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const STATS = [
  { label: "Events Hosted", color: "#F5C518", delay: 60, icon: iconCalendar, valueKey: "events" as const },
  { label: "Active Volunteers", color: "#A855F7", delay: 100, icon: iconVolunteers, valueKey: "volunteers" as const },
  { label: "Total Attendees", color: "#22C55E", delay: 140, icon: iconActivity, valueKey: "attendees" as const },
];

export function ChapterStatsCards({
  eventCount,
  volunteerCount,
  totalAttendees,
}: {
  eventCount: number;
  volunteerCount: number;
  totalAttendees: number;
}) {
  const values = {
    events: eventCount,
    volunteers: volunteerCount,
    attendees: totalAttendees,
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3 lg:hidden">
        {STATS.map((s) => (
          <ChapterStatCard
            key={s.valueKey}
            label={s.label}
            value={values[s.valueKey]}
            color={s.color}
            delay={s.delay}
            icon={s.icon}
          />
        ))}
      </div>

      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {STATS.map((s) => (
          <ChapterStatCard
            key={`lg-${s.valueKey}`}
            label={s.label}
            value={values[s.valueKey]}
            color={s.color}
            delay={s.delay}
            icon={s.icon}
          />
        ))}
      </div>
    </>
  );
}
