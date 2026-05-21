"use client";

import Link from "next/link";
import { totalSlots } from "@/lib/chapterConstants";
import type { ChapterEventDoc } from "@/types/chapter";
import { EventShareButton } from "@/components/events/EventShareButton";

export function PastEventRow({
  event,
  registeredCount,
  countLoading,
  index,
}: {
  event: ChapterEventDoc;
  registeredCount: number;
  countLoading: boolean;
  index: number;
}) {
  const d = event.date.toDate();
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = d.getDate();
  const total = totalSlots(event.roles);

  return (
    <Link
      href={`/events/${event.eventId}`}
      className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface border border-border/50 opacity-60 hover:opacity-90 transition-opacity duration-200 cursor-pointer animate-fade-up group"
      style={{ animationDelay: `${60 + index * 50}ms` }}
    >
      <div className="shrink-0 w-9 text-center">
        <div className="text-[9px] font-sans uppercase tracking-widest text-text-muted leading-none">{month}</div>
        <div className="text-xl font-heading text-text-secondary leading-tight tabular-nums">{day}</div>
      </div>

      <div className="w-px h-8 bg-border shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="font-heading text-sm text-text-primary leading-snug truncate">{event.name}</div>
        <div className="text-xs text-text-muted mt-0.5 truncate">{event.location}</div>
      </div>

      {!countLoading && (
        <div className="shrink-0 text-right hidden sm:block">
          <span className="text-xs text-text-muted tabular-nums">
            {registeredCount}/{total} {event.isInternal ? "attendees" : "volunteers"}
          </span>
        </div>
      )}

      <EventShareButton eventId={event.eventId} variant="icon" />

      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-text-muted group-hover:translate-x-0.5 transition-transform duration-150"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
