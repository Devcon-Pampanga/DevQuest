"use client";

import Link from "next/link";
import { totalSlots } from "@/lib/chapterConstants";
import { formatRelativeDate } from "@/lib/eventListFormat";
import type { ChapterEventDoc } from "@/types/chapter";

export function EventsListEventCard({
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
  const total = totalSlots(event.roles);
  const remaining = Math.max(0, total - registeredCount);
  const pct = total > 0 ? Math.min(100, (registeredCount / total) * 100) : 0;

  return (
    <Link
      href={`/events/${event.eventId}`}
      className="rounded-2xl bg-surface border border-border overflow-hidden flex flex-col hover:border-accent-primary/50 hover:shadow-[0_4px_20px_rgba(124,58,237,0.18)] transition-[border-color,box-shadow] duration-200 cursor-pointer animate-fade-up group"
      style={{ animationDelay: `${60 + index * 50}ms` }}
    >
      <div className="relative h-36 w-full overflow-hidden">
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
        {event.isInternal && (
          <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full bg-black/50 text-white font-medium backdrop-blur-sm">
            Internal
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h2 className="font-heading text-lg text-text-primary leading-tight">{event.name}</h2>

        <div className="flex flex-col gap-1.5 mt-3">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{formatRelativeDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-text-secondary">{event.isInternal ? "Attendees" : "Volunteers"}</span>
            {countLoading ? (
              <span className="text-text-muted text-xs">—</span>
            ) : (
              <span className="text-accent-highlight font-semibold tabular-nums">
                {registeredCount} / {total}
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-border mb-1">
            <div
              className="h-full rounded-full bg-accent-highlight transition-all duration-500"
              style={{ width: countLoading ? "0%" : `${pct}%` }}
            />
          </div>
          {!countLoading && (
            <span className="text-[11px] text-text-muted tabular-nums">
              {remaining} slot{remaining !== 1 ? "s" : ""} remaining
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
