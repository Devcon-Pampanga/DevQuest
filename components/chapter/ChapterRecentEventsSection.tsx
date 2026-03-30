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
      />
    </div>
  );
}
