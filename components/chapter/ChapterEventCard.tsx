"use client";

import Link from "next/link";
import { formatEventDate, totalSlots } from "@/lib/chapterConstants";
import type { ChapterEventDoc } from "@/types/chapter";

export function ChapterEventCard({
  event,
  regCount,
}: {
  event: ChapterEventDoc;
  regCount: number;
}) {
  const isPast = event.date.toDate() <= new Date();
  const total = totalSlots(event.roles);
  const pct = total > 0 ? Math.min(100, (regCount / total) * 100) : 0;

  return (
    <Link
      href={`/events/${event.eventId}`}
      className="rounded-xl bg-elevated border border-border overflow-hidden flex flex-col hover:border-accent-primary/50 transition-[border-color,box-shadow] hover:shadow-[0_4px_16px_rgba(124,58,237,0.15)] cursor-pointer group shrink-0"
      style={{ width: 210 }}
    >
      <div className="relative h-28 overflow-hidden">
        {event.bannerUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.bannerUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/event-banner-placeholder.png"
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <span
          className={`absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
            isPast
              ? "bg-black/50 text-text-muted"
              : "bg-accent-primary/80 text-white"
          }`}
        >
          {isPast ? "Completed" : "Upcoming"}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="font-heading text-sm text-text-primary leading-snug line-clamp-2">
          {event.name}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-text-muted">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatEventDate(event.date)}
        </div>

        <div className="mt-auto pt-1.5">
          <div className="h-1 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-highlight transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] text-text-muted mt-1 tabular-nums">
            {regCount} / {total} volunteers
          </div>
        </div>
      </div>
    </Link>
  );
}
