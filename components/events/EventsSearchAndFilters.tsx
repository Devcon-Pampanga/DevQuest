"use client";

import type { LegacyRef, RefObject } from "react";
import { CHAPTERS, shortChapter } from "@/lib/chapterConstants";
import { EVENT_LIST_TYPE_FILTERS } from "@/lib/eventsListFilters";
import type { EventsTimeFilter } from "@/hooks/useEventsListFilters";

const CHIP_ACTIVE = "bg-accent-highlight border-accent-highlight text-white";
const CHIP_IDLE = "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary";

const STATUS_FILTERS: { key: EventsTimeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

export function EventsSearchAndFilters({
  search,
  onSearchChange,
  filterRef,
  filterOpen,
  onFilterToggle,
  activeFilter,
  onActiveFilterChange,
  eventTypeFilter,
  onEventTypeFilterChange,
  chapterFilter,
  onChapterFilterChange,
  activeFilterCount,
  onClearPanelFiltersOnly,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  filterRef: RefObject<HTMLDivElement | null>;
  filterOpen: boolean;
  onFilterToggle: () => void;
  activeFilter: EventsTimeFilter;
  onActiveFilterChange: (v: EventsTimeFilter) => void;
  eventTypeFilter: string;
  onEventTypeFilterChange: (v: string) => void;
  chapterFilter: string;
  onChapterFilterChange: (v: string) => void;
  activeFilterCount: number;
  onClearPanelFiltersOnly: () => void;
}) {
  return (
    <div
      className="relative z-10 animate-fade-up"
      style={{ animationDelay: "0ms" }}
      ref={filterRef as LegacyRef<HTMLDivElement>}
    >
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onFilterToggle}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-heading transition-colors shrink-0 ${
            filterOpen || activeFilterCount > 0
              ? "bg-accent-primary/20 border-accent-primary text-accent-highlight"
              : "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary"
          }`}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-accent-highlight text-white text-[10px] font-sans leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filterOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl border border-border bg-elevated p-5 flex flex-col gap-5 animate-modal-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Filters</span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onClearPanelFiltersOnly}
                className="text-xs text-text-secondary hover:text-accent-highlight transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Time</span>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onActiveFilterChange(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors active:scale-95 ${
                    activeFilter === key ? CHIP_ACTIVE : CHIP_IDLE
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Event Type</span>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onEventTypeFilterChange("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors active:scale-95 ${
                  eventTypeFilter === "all" ? CHIP_ACTIVE : CHIP_IDLE
                }`}
              >
                All
              </button>
              {EVENT_LIST_TYPE_FILTERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onEventTypeFilterChange(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors active:scale-95 ${
                    eventTypeFilter === t ? CHIP_ACTIVE : CHIP_IDLE
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Chapter</span>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onChapterFilterChange("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors active:scale-95 ${
                  chapterFilter === "all" ? CHIP_ACTIVE : CHIP_IDLE
                }`}
              >
                All
              </button>
              {CHAPTERS.map((chapter) => (
                <button
                  key={chapter}
                  type="button"
                  onClick={() => onChapterFilterChange(chapter)}
                  className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors active:scale-95 ${
                    chapterFilter === chapter ? CHIP_ACTIVE : CHIP_IDLE
                  }`}
                >
                  {shortChapter(chapter)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
