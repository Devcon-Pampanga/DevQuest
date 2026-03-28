"use client";

import Link from "next/link";
import { ChapterEventCard } from "./ChapterEventCard";
import type { ChapterEventDoc } from "@/types/chapter";

export function ChapterRecentEventsSection({
  events,
  regCounts,
}: {
  events: ChapterEventDoc[];
  regCounts: Record<string, number>;
}) {
  if (events.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-3 animate-fade-up order-5 lg:order-none"
      style={{ animationDelay: "160ms" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-heading text-xs text-text-secondary uppercase tracking-widest">
            Recent Events
          </span>
          <span className="text-xs text-text-muted tabular-nums">{events.length}</span>
        </div>
        <Link
          href="/events"
          className="text-xs text-accent-highlight hover:text-accent-primary font-medium transition-colors flex items-center gap-1"
        >
          See All
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-minimal -mx-1 px-1">
        {events.slice(0, 12).map((ev) => (
          <ChapterEventCard
            key={ev.eventId}
            event={ev}
            regCount={regCounts[ev.eventId] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
