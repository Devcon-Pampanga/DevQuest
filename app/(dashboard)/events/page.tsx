"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";
import { EventsPageSkeleton } from "@/components/events/EventsPageSkeleton";
import { EventsSearchAndFilters } from "@/components/events/EventsSearchAndFilters";
import { EventsListEmpty } from "@/components/events/EventsListEmpty";
import { EventsListZero } from "@/components/events/EventsListZero";
import { EventsListContent } from "@/components/events/EventsListContent";
import { EventsDataDashboard } from "@/components/events/EventsDataDashboard";
import type { ReflectionEntry } from "@/components/events/EventsDataDashboard";
import { useEventsPageAuth } from "@/hooks/useEventsPageAuth";
import { useEventsListData } from "@/hooks/useEventsListData";
import { useEventsListFilters } from "@/hooks/useEventsListFilters";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";

type PageTab = "events" | "data";

function ReflectionDataSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* Filter row */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-9 w-48 rounded-lg" />
        <SkeletonBlock className="h-7 w-20 rounded-lg" />
      </div>
      {/* KPI card */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <SkeletonLine className="w-40 mb-5" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <SkeletonBlock className="w-[72px] h-[72px] rounded-full" />
              <SkeletonLine className="w-14" />
            </div>
          ))}
        </div>
      </div>
      {/* Bar chart cards (Pre-Event + On-Site) */}
      {[0, 1].map((s) => (
        <div key={s} className="bg-surface border border-border rounded-2xl p-5">
          <SkeletonLine className="w-40 mb-5" />
          <div className="flex flex-col gap-2 mb-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBlock className="h-3 w-28 rounded-full shrink-0" />
                <SkeletonBlock className="h-2 flex-1 rounded-full" />
                <SkeletonBlock className="h-3 w-6 rounded shrink-0" />
              </div>
            ))}
          </div>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-20 w-full rounded-xl mb-3" />
          ))}
        </div>
      ))}
      {/* Mood card */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <SkeletonLine className="w-32 mb-5" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Insights card */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <SkeletonLine className="w-48 mb-5" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Response rows */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <SkeletonLine className="w-36 mb-5" />
        <div className="flex flex-col divide-y divide-border -mx-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <SkeletonBlock className="w-7 h-7 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <SkeletonLine className="w-32" />
                <SkeletonLine className="w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { userData, authChecked } = useEventsPageAuth();
  const { events, loadingEvents, fetchError, registrationCounts, countsLoading } =
    useEventsListData(userData);
  const filters = useEventsListFilters(events);

  const [pageTab, setPageTab] = useState<PageTab>("events");
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [refLoading, setRefLoading] = useState(false);

  const avatarUrl = userData
    ? buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  const isCoord = userData?.role === "coordinator";

  // Lazy-load reflections when the Data tab is opened for the first time
  useEffect(() => {
    if (pageTab !== "data" || !isCoord || reflections.length > 0) return;

    async function loadReflections() {
      setRefLoading(true);
      try {
        const evSnap = await getDocs(collection(db, "events"));
        const results: ReflectionEntry[] = [];

        await Promise.all(
          evSnap.docs.map(async (evDoc) => {
            const ev = evDoc.data();
            const regs = await getDocs(
              collection(db, "events", evDoc.id, "registrations")
            );
            await Promise.all(
              regs.docs.map(async (regDoc) => {
                const reg = regDoc.data();
                if (!reg.reflectionSubmitted || !reg.reflectionData) return;
                const rd = reg.reflectionData;

                let username = reg.userId;
                try {
                  const u = await getDoc(doc(db, "users", reg.userId));
                  if (u.exists()) username = u.data().username ?? reg.userId;
                } catch {
                  /* ok */
                }

                results.push({
                  userId: reg.userId,
                  username,
                  firstName: rd.firstName ?? "",
                  lastName: rd.lastName ?? "",
                  eventId: evDoc.id,
                  eventName: ev.name ?? "Unknown",
                  chapter: rd.chapterId ?? ev.chapterId ?? "Unknown",
                  rolePosition: rd.rolePosition ?? reg.role ?? "",
                  ratings: rd.ratings ?? {},
                  mood: rd.mood ?? "okay",
                  insights: rd.insights ?? "",
                  submittedAt: rd.submittedAt,
                });
              })
            );
          })
        );

        results.sort(
          (a, b) =>
            (b.submittedAt?.toDate().getTime() ?? 0) -
            (a.submittedAt?.toDate().getTime() ?? 0)
        );
        setReflections(results);
      } catch (e) {
        console.error(e);
      } finally {
        setRefLoading(false);
      }
    }

    loadReflections();
  }, [pageTab, isCoord, reflections.length]);

  return (
    <PageShell
      title="Events"
      avatarUrl={avatarUrl}
      loading={!authChecked || loadingEvents}
      skeleton={<EventsPageSkeleton />}
      actions={
        isCoord ? (
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
      {/* Tab bar — coordinator only */}
      {isCoord && (
        <div className="flex border-b border-border px-6 shrink-0">
          {(["events", "data"] as PageTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPageTab(tab)}
              className={`px-4 py-3 text-sm font-heading font-medium capitalize transition-colors border-b-2 -mb-px ${
                pageTab === tab
                  ? "border-accent-highlight text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab === "data" ? "Reflection Data" : "Events"}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className={`${pageTab === "data" ? "max-w-2xl" : "max-w-3xl lg:max-w-5xl"} mx-auto flex flex-col gap-5`}>
          {pageTab === "events" ? (
            <>
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
                <EventsListZero isCoordinator={isCoord} />
              ) : (
                <EventsListContent
                  upcomingFiltered={filters.upcomingFiltered}
                  pastFiltered={filters.pastFiltered}
                  hasBoth={filters.hasBoth}
                  registrationCounts={registrationCounts}
                  countsLoading={countsLoading}
                />
              )}
            </>
          ) : refLoading ? (
            <ReflectionDataSkeleton />
          ) : (
            <EventsDataDashboard reflections={reflections} events={events} />
          )}
        </div>
      </div>
    </PageShell>
  );
}
