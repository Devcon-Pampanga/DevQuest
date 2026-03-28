export function DashboardQuickStats({
  teamColor,
  completedQuestCount,
  eventsAttendedCount,
}: {
  teamColor: string;
  completedQuestCount: number;
  eventsAttendedCount: number;
}) {
  return (
    <div className="order-3 lg:order-none grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
      <div className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${teamColor}18` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={teamColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Quests Complete</p>
          <p className="font-heading text-2xl tabular-nums leading-none mt-0.5" style={{ color: teamColor }}>
            {completedQuestCount}
          </p>
        </div>
      </div>
      <div className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${teamColor}18` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={teamColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Events Attended</p>
          <p className="font-heading text-2xl tabular-nums leading-none mt-0.5" style={{ color: teamColor }}>
            {eventsAttendedCount}
          </p>
        </div>
      </div>
    </div>
  );
}
