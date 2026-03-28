"use client";

import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { EventsPageSkeleton } from "@/components/events/EventsPageSkeleton";
import { EventsSearchAndFilters } from "@/components/events/EventsSearchAndFilters";
import { EventsListEmpty } from "@/components/events/EventsListEmpty";
import { EventsListZero } from "@/components/events/EventsListZero";
import { EventsListContent } from "@/components/events/EventsListContent";
import { useEventsPageAuth } from "@/hooks/useEventsPageAuth";
import { useEventsListData } from "@/hooks/useEventsListData";
import { useEventsListFilters } from "@/hooks/useEventsListFilters";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";

export default function EventsPage() {
  const { userData, authChecked } = useEventsPageAuth();
  const { events, loadingEvents, fetchError, registrationCounts, countsLoading } =
    useEventsListData(userData);
  const filters = useEventsListFilters(events);

  const avatarUrl = userData
    ? buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  return (
    <PageShell
      title="Events"
      avatarUrl={avatarUrl}
      loading={!authChecked || loadingEvents}
      skeleton={<EventsPageSkeleton />}
      actions={
        userData?.role === "coordinator" ? (
          <Link
            href="/events/new"
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-highlight hover:bg-accent-primary rounded-xl text-white text-sm font-heading font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Event
          </Link>
        ) : null
      }
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5">
          <EventsSearchAndFilters
            search={filters.search}
            onSearchChange={filters.setSearch}
            filterRef={filters.filterRef}
            filterOpen={filters.filterOpen}
            onFilterToggle={() => filters.setFilterOpen((v) => !v)}
            activeFilter={filters.activeFilter}
            onActiveFilterChange={filters.setActiveFilter}
            eventTypeFilter={filters.eventTypeFilter}
            onEventTypeFilterChange={filters.setEventTypeFilter}
            chapterFilter={filters.chapterFilter}
            onChapterFilterChange={filters.setChapterFilter}
            activeFilterCount={filters.activeFilterCount}
            onClearPanelFiltersOnly={filters.clearPanelFilters}
          />

          {fetchError ? (
            <div className="flex flex-col items-center justify-center py-24 text-red-400 gap-3 text-sm">
              {fetchError}
            </div>
          ) : filters.isFilteredEmpty ? (
            <EventsListEmpty onClear={filters.clearAllFiltersAndSearch} />
          ) : filters.isTrulyEmpty ? (
            <EventsListZero isCoordinator={userData?.role === "coordinator"} />
          ) : (
            <EventsListContent
              upcomingFiltered={filters.upcomingFiltered}
              pastFiltered={filters.pastFiltered}
              hasBoth={filters.hasBoth}
              registrationCounts={registrationCounts}
              countsLoading={countsLoading}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
