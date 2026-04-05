"use client";

import { ChapterStatCard } from "@/components/chapter/ChapterStatCard";

interface CoordinatorStatsRowProps {
  volunteerCount: number;
  pendingApprovalsCount: number;
  activeSubquestCount: number;
}

export function CoordinatorStatsRow({
  volunteerCount,
  pendingApprovalsCount,
  activeSubquestCount,
}: CoordinatorStatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-6">
      <ChapterStatCard
        label="Total Volunteers"
        value={volunteerCount}
        color="#06B6D4"
        delay={0}
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />
      <ChapterStatCard
        label="Pending Approvals"
        value={pendingApprovalsCount}
        color="#A855F7"
        delay={60}
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        }
      />
      <ChapterStatCard
        label="Active Subquests"
        value={activeSubquestCount}
        color="#F5C518"
        delay={120}
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        }
      />
    </div>
  );
}
