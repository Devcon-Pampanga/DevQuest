import type { EventDoc, EventRole } from "@/lib/events/types";

interface EventRolesSectionProps {
  event: EventDoc;
  slotCounts: Record<string, number>;
}

export function EventRolesSection({ event, slotCounts }: EventRolesSectionProps) {
  return (
    <div>
      <h2 className="font-heading text-sm text-text-muted uppercase tracking-wider mb-3">
        {event.isInternal ? "Attendee Seats" : "Volunteer Roles"}
      </h2>
      <div className={event.isInternal ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        {event.roles.map((role: EventRole, index: number) => {
          const filled = slotCounts[role.roleName] ?? 0;
          const pct = role.slots > 0 ? Math.min(100, (filled / role.slots) * 100) : 0;
          const full = filled >= role.slots;
          return (
            <div
              key={role.roleName}
              className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 animate-fade-up"
              style={{ animationDelay: `${60 + index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm text-text-primary">{role.roleName}</span>
                <span className="text-sm font-semibold text-accent-highlight">+{role.xpReward} XP</span>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={full ? "text-red-400" : "text-text-muted"}>
                    {full ? "Full" : `${role.slots - filled} slot${role.slots - filled !== 1 ? "s" : ""} left`}
                  </span>
                  <span className="text-text-muted">
                    {filled}/{role.slots}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all ${full ? "bg-red-500" : "bg-accent-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
