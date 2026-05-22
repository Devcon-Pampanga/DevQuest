import Link from "next/link";
import { ChapterEventCard } from "@/components/chapter/ChapterEventCard";
import type { ChapterEventDoc } from "@/types/chapter";

interface EventCarouselSectionProps {
  events: ChapterEventDoc[];
  regCounts: Record<string, number>;
  title: string;
  viewAllHref: string;
  viewAllLabel?: string;
  showCount?: boolean;
  animated?: boolean;
  emptyState?: React.ReactNode;
  maxItems?: number;
}

export function EventCarouselSection({
  events,
  regCounts,
  title,
  viewAllHref,
  viewAllLabel = "See All",
  showCount = false,
  animated = false,
  emptyState,
  maxItems = 12,
}: EventCarouselSectionProps) {
  if (events.length === 0) {
    return emptyState ?? null;
  }

  const visible = events.slice(0, maxItems);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-heading text-xs text-text-secondary uppercase tracking-widest">
            {title}
          </span>
          {showCount && (
            <span className="text-xs text-text-muted tabular-nums">{events.length}</span>
          )}
        </div>
        <Link
          href={viewAllHref}
          className="text-xs text-accent-highlight hover:text-accent-primary font-medium transition-colors flex items-center gap-1"
        >
          {viewAllLabel}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-minimal -mx-1 px-1">
        {visible.map((ev, i) => (
          <div
            key={ev.eventId}
            className={animated ? "shrink-0 animate-fade-up" : "shrink-0"}
            style={animated ? { animationDelay: `${240 + i * 50}ms` } : undefined}
          >
            <ChapterEventCard event={ev} regCount={regCounts[ev.eventId] ?? 0} />
          </div>
        ))}
      </div>
    </div>
  );
}
