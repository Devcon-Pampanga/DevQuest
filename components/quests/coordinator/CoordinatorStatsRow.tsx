"use client";

interface CoordinatorStatsRowProps {
  volunteerCount: number;
  pendingApprovalsCount: number;
  activeMissionCount: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
  delay?: string;
}

function StatCard({ label, value, icon, accent = false, delay = "0ms" }: StatCardProps) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl border p-4 flex items-center gap-3 animate-fade-up"
      style={{
        backgroundColor: accent && value > 0 ? "#A855F708" : "#16213e",
        borderColor: accent && value > 0 ? "#A855F755" : "#27272A",
        animationDelay: delay,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: accent && value > 0 ? "#A855F71A" : "#ffffff08" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className="font-heading text-2xl font-bold leading-none"
          style={{ color: accent && value > 0 ? "#A855F7" : "#ffffff" }}
        >
          {value}
        </p>
        <p className="text-[11px] text-text-muted mt-0.5 truncate">{label}</p>
      </div>
      {accent && value > 0 && (
        <div
          className="w-2 h-2 rounded-full shrink-0 ml-auto"
          style={{
            backgroundColor: "#A855F7",
            animation: "count-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) 700ms 3",
          }}
        />
      )}
    </div>
  );
}

export function CoordinatorStatsRow({
  volunteerCount,
  pendingApprovalsCount,
  activeMissionCount,
}: CoordinatorStatsRowProps) {
  return (
    <div className="lg:col-span-3 flex flex-col sm:flex-row gap-3">
      <StatCard
        label="Total Volunteers"
        value={volunteerCount}
        delay="0ms"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />
      <StatCard
        label="Pending Approvals"
        value={pendingApprovalsCount}
        accent
        delay="60ms"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={pendingApprovalsCount > 0 ? "#A855F7" : "#A1A1AA"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        }
      />
      <StatCard
        label="Active Missions"
        value={activeMissionCount}
        delay="120ms"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        }
      />
    </div>
  );
}
