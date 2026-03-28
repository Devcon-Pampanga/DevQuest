import Link from "next/link";
import type { PendingReflection } from "@/types/dashboard";

export function DashboardReflectionNudge({ pending }: { pending: PendingReflection }) {
  return (
    <div
      className="order-2 lg:order-none rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-up"
      style={{ animationDelay: "60ms" }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-xl shrink-0" aria-hidden>
          ⏳
        </span>
        <div className="min-w-0">
          <p className="text-sm font-heading text-amber-100/95">
            {pending.eventName} — reflection due in {pending.hoursLeft}h
          </p>
          <p className="text-xs text-text-muted font-sans mt-0.5">Submit before the deadline to earn +25 XP.</p>
        </div>
      </div>
      <Link
        href={`/events/${pending.eventId}/reflect`}
        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-heading transition-colors"
      >
        Submit Now
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  );
}
