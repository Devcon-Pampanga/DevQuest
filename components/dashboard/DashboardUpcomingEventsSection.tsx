import Link from "next/link";
import { ChapterEventCard } from "@/components/chapter/ChapterEventCard";
import type { ChapterEventDoc } from "@/types/chapter";

export function DashboardUpcomingEventsSection({
  upcomingChapterEvents,
  upcomingRegCounts,
}: {
  upcomingChapterEvents: ChapterEventDoc[];
  upcomingRegCounts: Record<string, number>;
}) {
  return (
    <section className="order-7 lg:order-none animate-fade-up" style={{ animationDelay: "180ms" }}>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-heading text-xl text-text-primary">Upcoming events</h2>
        <Link href="/events" className="text-xs font-heading text-accent-highlight hover:text-text-primary transition-colors" aria-label="View all events">
          View all
        </Link>
      </div>
      {upcomingChapterEvents.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-8 flex flex-col items-center gap-3 text-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
            aria-hidden
            style={{ animation: "float 3s ease-in-out 300ms infinite" }}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div>
            <p className="font-heading text-sm text-text-primary mb-1">No upcoming events</p>
            <p className="text-xs text-text-muted font-sans max-w-[26ch] mx-auto">
              Your chapter coordinator will post events here when they&apos;re scheduled.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center justify-center border border-border rounded-xl px-4 py-2 text-xs font-heading text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors"
          >
            View All Events
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-minimal -mx-1 px-1">
          {upcomingChapterEvents.map((ev, i) => (
            <div
              key={ev.eventId}
              className="shrink-0 animate-fade-up"
              style={{ animationDelay: `${240 + i * 50}ms` }}
            >
              <ChapterEventCard event={ev} regCount={upcomingRegCounts[ev.eventId] ?? 0} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
