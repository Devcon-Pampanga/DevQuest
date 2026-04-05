"use client";

import { ChapterStatCard } from "@/components/chapter/ChapterStatCard";

const iconCalendar = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const iconBadge = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const iconStar = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export function ProfileStatCards({
  eventCount,
  badgesEarned,
  starsReceived,
}: {
  eventCount: number;
  badgesEarned: number;
  starsReceived: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 lg:gap-6">
      <ChapterStatCard label="Events Attended" value={eventCount} color="#06B6D4" icon={iconCalendar} delay={60} />
      <ChapterStatCard label="Badges Earned" value={badgesEarned} color="#A855F7" icon={iconBadge} delay={100} />
      <ChapterStatCard label="Stars Received" value={starsReceived} color="#F5C518" icon={iconStar} delay={140} />
    </div>
  );
}
