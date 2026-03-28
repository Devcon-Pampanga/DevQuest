"use client";

import type { ChapterEventDoc } from "@/types/chapter";
import { EventsListEventCard } from "./EventsListEventCard";
import { PastEventRow } from "./PastEventRow";

export function EventsListContent({
  upcomingFiltered,
  pastFiltered,
  hasBoth,
  registrationCounts,
  countsLoading,
}: {
  upcomingFiltered: ChapterEventDoc[];
  pastFiltered: ChapterEventDoc[];
  hasBoth: boolean;
  registrationCounts: Record<string, number>;
  countsLoading: boolean;
}) {
  return (
    <>
      {upcomingFiltered.length > 0 && (
        <>
          {hasBoth && (
            <div className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
              <span className="font-heading text-xs text-text-secondary uppercase tracking-widest">Upcoming</span>
              <span className="text-xs text-text-muted tabular-nums">{upcomingFiltered.length}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingFiltered.map((event, i) => (
              <EventsListEventCard
                key={event.eventId}
                index={i}
                event={event}
                registeredCount={registrationCounts[event.eventId] ?? 0}
                countLoading={countsLoading}
              />
            ))}
          </div>
        </>
      )}

      {pastFiltered.length > 0 && (
        <>
          <div
            className={`flex items-center gap-3 animate-fade-up ${hasBoth ? "mt-4" : ""}`}
            style={{ animationDelay: "60ms" }}
          >
            {hasBoth && (
              <span className="font-heading text-xs text-text-muted uppercase tracking-widest">Past</span>
            )}
            {hasBoth && (
              <span className="text-xs text-text-muted tabular-nums">{pastFiltered.length}</span>
            )}
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <div className="flex flex-col gap-2">
            {pastFiltered.map((event, i) => (
              <PastEventRow
                key={event.eventId}
                index={i}
                event={event}
                registeredCount={registrationCounts[event.eventId] ?? 0}
                countLoading={countsLoading}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
