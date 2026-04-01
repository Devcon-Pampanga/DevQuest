"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { ChapterEventDoc } from "@/types/chapter";

export type EventsTimeFilter = "all" | "upcoming" | "past";

export function useEventsListFilters(events: ChapterEventDoc[]) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<EventsTimeFilter>("all");
  const [chapterFilter, setChapterFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
      .filter((e) => {
        if (activeFilter === "upcoming") return e.date.toDate() > now;
        if (activeFilter === "past") return e.date.toDate() <= now;
        return true;
      })
      .filter((e) => {
        if (chapterFilter === "all") return true;
        return e.chapterId === chapterFilter;
      })
      .filter((e) => {
        if (eventTypeFilter === "all") return true;
        return e.eventType === eventTypeFilter;
      });
  }, [events, search, activeFilter, chapterFilter, eventTypeFilter]);

  const upcomingFiltered = filtered.filter((e) => e.date.toDate() > new Date());
  const pastFiltered = filtered.filter((e) => e.date.toDate() <= new Date());
  const hasBoth = upcomingFiltered.length > 0 && pastFiltered.length > 0;
  const isTrulyEmpty = events.length === 0;
  const isFilteredEmpty = events.length > 0 && filtered.length === 0;

  const activeFilterCount =
    (activeFilter !== "all" ? 1 : 0) +
    (eventTypeFilter !== "all" ? 1 : 0) +
    (chapterFilter !== "all" ? 1 : 0);

  /** Resets time / type / chapter filters only (matches panel "Clear all"). */
  function clearPanelFilters() {
    setActiveFilter("all");
    setEventTypeFilter("all");
    setChapterFilter("all");
  }

  /** Resets search + all filters (matches "No events match" bar). */
  function clearAllFiltersAndSearch() {
    setSearch("");
    setActiveFilter("all");
    setEventTypeFilter("all");
    setChapterFilter("all");
  }

  return {
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    chapterFilter,
    setChapterFilter,
    eventTypeFilter,
    setEventTypeFilter,
    filterOpen,
    setFilterOpen,
    filterRef,
    filtered,
    upcomingFiltered,
    pastFiltered,
    hasBoth,
    isTrulyEmpty,
    isFilteredEmpty,
    activeFilterCount,
    clearPanelFilters,
    clearAllFiltersAndSearch,
  };
}
