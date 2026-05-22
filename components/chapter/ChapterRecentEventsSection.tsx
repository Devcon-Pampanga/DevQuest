"use client";

import { EventCarouselSection } from "@/components/events/EventCarouselSection";
import type { ChapterEventDoc } from "@/types/chapter";

export function ChapterRecentEventsSection({
  events,
  regCounts,
}: {
  events: ChapterEventDoc[];
  regCounts: Record<string, number>;
}) {
  return (
    <div
      className="flex flex-col gap-3 animate-fade-up order-5 lg:order-none"
      style={{ animationDelay: "160ms" }}
    >
      <EventCarouselSection
        events={events}
        regCounts={regCounts}
        title="Recent Events"
        viewAllHref="/events"
        viewAllLabel="See All"
        showCount
        maxItems={12}
        emptyState={
          <div className="flex flex-col gap-3">
            <span className="font-heading text-xs text-text-secondary uppercase tracking-widest">
              Recent Events
            </span>
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#27272A] bg-surface py-10">
              <div className="flex flex-col items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <p className="text-sm text-text-muted">No events yet for this chapter.</p>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
