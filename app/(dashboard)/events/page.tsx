"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";


// ─── Types ────────────────────────────────────────────────────────────────────

interface AvatarOptions {
  backgroundColor: string;
  backgroundType: "solid" | "gradientLinear";
  eyes: string;
  mouth: string;
}

interface UserData {
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  avatarOptions?: AvatarOptions;
}

interface EventRole {
  roleName: string;
  slots: number;
  xpReward: number;
}

interface EventDoc {
  eventId: string;
  name: string;
  description: string;
  date: Timestamp;
  location: string;
  chapterId: string;
  roles: EventRole[];
  bannerUrl?: string;
  eventType?: string;
  isInternal?: boolean;
}

const EVENT_TYPES = [
  "Workshop",
  "Seminar",
  "Convention",
  "Hackathon",
  "Networking",
  "Training",
  "Community Meetup",
  "Other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR: AvatarOptions = {
  backgroundColor: "5e35b1",
  backgroundType: "solid",
  eyes: "round",
  mouth: "smile01",
};

function buildAvatarUrl(seed: string, opts: AvatarOptions): string {
  const params: Record<string, string> = {
    seed,
    backgroundColor: opts.backgroundColor,
    backgroundType: opts.backgroundType,
    eyes: opts.eyes,
    mouth: opts.mouth,
  };
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?${new URLSearchParams(params).toString()}`;
}

function formatEventDate(ts: Timestamp): string {
  const d = ts.toDate();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeDate(ts: Timestamp): string {
  const now = new Date();
  const d = ts.toDate();
  if (d <= now) return formatEventDate(ts);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((eventMidnight.getTime() - todayMidnight.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `This ${d.toLocaleDateString("en-US", { weekday: "long" })}`;
  return formatEventDate(ts);
}

const EVENT_GRADIENTS: Record<string, string> = {
  "Workshop":        "linear-gradient(135deg, #7C3AED, #A855F7)",
  "Seminar":         "linear-gradient(135deg, #4C1D95, #7C3AED)",
  "Convention":      "linear-gradient(135deg, #F5C518, #F97316)",
  "Hackathon":       "linear-gradient(135deg, #06B6D4, #9333EA)",
  "Networking":      "linear-gradient(135deg, #F97316, #EA580C)",
  "Training":        "linear-gradient(135deg, #22C55E, #16A34A)",
  "Community Meetup":"linear-gradient(135deg, #06B6D4, #0891B2)",
  "Other":           "linear-gradient(135deg, #7C3AED, #A855F7)",
};

function getEventGradient(eventType?: string, eventId?: string): string {
  if (eventType && EVENT_GRADIENTS[eventType]) return EVENT_GRADIENTS[eventType];
  if (eventId) {
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) hash = (hash * 31 + eventId.charCodeAt(i)) & 0xffffffff;
    const values = Object.values(EVENT_GRADIENTS);
    return values[Math.abs(hash) % values.length];
  }
  return EVENT_GRADIENTS["Other"];
}

function totalSlots(roles: EventRole[]): number {
  return roles.reduce((sum, r) => sum + r.slots, 0);
}

function isUpcoming(ts: Timestamp): boolean {
  return ts.toDate() > new Date();
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  registeredCount,
  countLoading,
  index,
}: {
  event: EventDoc;
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
      {/* Banner */}
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
          <div
            className="w-full h-full"
            style={{ background: getEventGradient(event.eventType, event.eventId) }}
          />
        )}
        {event.isInternal && (
          <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full bg-black/50 text-white font-medium backdrop-blur-sm">
            Internal
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h2 className="font-heading text-lg text-text-primary leading-tight">
          {event.name}
        </h2>

        {/* Date + location grouped as logistics */}
        <div className="flex flex-col gap-1.5 mt-3">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{formatRelativeDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        {/* Slots */}
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

// ─── Past Event Row ───────────────────────────────────────────────────────────

function PastEventRow({
  event,
  registeredCount,
  countLoading,
  index,
}: {
  event: EventDoc;
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
      {/* Date block */}
      <div className="shrink-0 w-9 text-center">
        <div className="text-[9px] font-sans uppercase tracking-widest text-text-muted leading-none">
          {month}
        </div>
        <div className="text-xl font-heading text-text-secondary leading-tight tabular-nums">
          {day}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-border shrink-0" />

      {/* Name + location */}
      <div className="flex-1 min-w-0">
        <div className="font-heading text-sm text-text-primary leading-snug truncate">
          {event.name}
        </div>
        <div className="text-xs text-text-muted mt-0.5 truncate">{event.location}</div>
      </div>

      {/* Slot count */}
      {!countLoading && (
        <div className="shrink-0 text-right hidden sm:block">
          <span className="text-xs text-text-muted tabular-nums">
            {registeredCount}/{total} {event.isInternal ? "attendees" : "volunteers"}
          </span>
        </div>
      )}

      {/* Chevron */}
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EventsSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5 pb-10">
      {/* Search + filter bar */}
      <div className="flex gap-2 items-center">
        <SkeletonBlock className="h-10 flex-1 rounded-xl" />
        <SkeletonBlock className="h-10 w-24 rounded-xl shrink-0" />
      </div>

      {/* Upcoming section header */}
      <div className="flex items-center gap-3">
        <SkeletonLine className="w-20" />
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Upcoming cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] overflow-hidden flex flex-col animate-pulse"
          >
            <SkeletonBlock className="h-36 w-full rounded-none" />
            <div className="p-5 flex flex-col gap-3 flex-1">
              <SkeletonLine className="w-4/5" />
              <SkeletonLine className="w-1/2" />
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-3.5 w-3.5 rounded-sm shrink-0" />
                <SkeletonLine className="w-28" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-3.5 w-3.5 rounded-sm shrink-0" />
                <SkeletonLine className="w-36" />
              </div>
              <div className="mt-auto pt-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <SkeletonLine className="w-20" />
                  <SkeletonLine className="w-12" />
                </div>
                <SkeletonBlock className="h-1.5 w-full rounded-full" />
                <SkeletonLine className="w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Past section header */}
      <div className="flex items-center gap-3 mt-2">
        <SkeletonLine className="w-12" />
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Past event rows */}
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#1a1a2e] border border-[#27272A] animate-pulse opacity-60"
          >
            <div className="shrink-0 w-9 flex flex-col gap-1 items-center">
              <SkeletonLine className="w-6" />
              <SkeletonBlock className="h-5 w-8 rounded" />
            </div>
            <div className="w-px h-8 bg-border shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <SkeletonLine className="w-3/5" />
              <SkeletonLine className="w-2/5" />
            </div>
            <SkeletonLine className="w-24 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

const CHAPTERS = [
  "DEVCON Kids Baguio",
  "DEVCON Kids Cagayan de Oro",
  "DEVCON Kids Cebu",
  "DEVCON Kids Davao",
  "DEVCON Kids Iloilo",
  "DEVCON Kids Manila",
  "DEVCON Kids Pampanga",
  "DEVCON Kids Quezon City",
  "DEVCON Kids Tacloban",
  "DEVCON Kids Zamboanga",
] as const;

type FilterType = "all" | "upcoming" | "past";

export default function EventsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [chapterFilter, setChapterFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data()?.onboardingComplete !== true) {
        router.replace("/onboarding");
        return;
      }

      setUserData(snap.data() as UserData);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  // ── Close filter on outside click ───────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Fetch events ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userData) return;

    async function fetchEvents() {
      setLoadingEvents(true);
      try {
        const q = query(collection(db, "events"));
        const snapshot = await getDocs(q);
        const now = Date.now();
        const docs = snapshot.docs
          .map((d) => ({ eventId: d.id, ...d.data() }) as EventDoc)
          .sort((a, b) => {
            const aUp = a.date.toMillis() > now;
            const bUp = b.date.toMillis() > now;
            if (aUp && !bUp) return -1;
            if (!aUp && bUp) return 1;
            if (aUp && bUp) return a.date.toMillis() - b.date.toMillis();
            return b.date.toMillis() - a.date.toMillis();
          });
        setEvents(docs);
        setCountsLoading(true);
        const countEntries = await Promise.all(
          docs.map(async (event) => {
            const snap = await getCountFromServer(
              collection(db, "events", event.eventId, "registrations")
            );
            return [event.eventId, snap.data().count] as [string, number];
          })
        );
        setRegistrationCounts(Object.fromEntries(countEntries));
        setCountsLoading(false);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setFetchError("Could not load events. Check the console for details.");
      } finally {
        setLoadingEvents(false);
      }
    }

    fetchEvents();
  }, [userData]);

  // ── Filtered events ─────────────────────────────────────────────────────────
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

  const avatarUrl = userData
    ? buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  const statusFilters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  // Strip the "DEVCON Kids " prefix for compact chip labels
  function shortChapter(chapter: string): string {
    return chapter.replace(/^DEVCON Kids\s+/i, "");
  }

  const activeFilterCount =
    (activeFilter !== "all" ? 1 : 0) +
    (eventTypeFilter !== "all" ? 1 : 0) +
    (chapterFilter !== "all" ? 1 : 0);

  const CHIP_ACTIVE = "bg-accent-highlight border-accent-highlight text-white";
  const CHIP_IDLE = "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary";

  return (
    <PageShell
      title="Events"
      avatarUrl={avatarUrl}
      loading={!authChecked || loadingEvents}
      skeleton={<EventsSkeleton />}
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
        {/* Search + filter button */}
        <div className="relative animate-fade-up" style={{ animationDelay: "0ms" }} ref={filterRef}>
          <div className="flex gap-2 items-center">
            {/* Search */}
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
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-colors"
              />
            </div>

            {/* Filter toggle button */}
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-heading transition-colors shrink-0 ${
                filterOpen || activeFilterCount > 0
                  ? "bg-accent-primary/20 border-accent-primary text-accent-highlight"
                  : "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

          {/* Filter panel dropdown */}
          {filterOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl border border-border bg-elevated p-5 flex flex-col gap-5 animate-modal-in"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Filters</span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setActiveFilter("all");
                      setEventTypeFilter("all");
                      setChapterFilter("all");
                    }}
                    className="text-xs text-text-secondary hover:text-accent-highlight transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Time */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Time</span>
                <div className="flex gap-2 flex-wrap">
                  {statusFilters.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key)}
                      className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors active:scale-95 ${
                        activeFilter === key ? CHIP_ACTIVE : CHIP_IDLE
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Type */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Event Type</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setEventTypeFilter("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors active:scale-95 ${
                      eventTypeFilter === "all" ? CHIP_ACTIVE : CHIP_IDLE
                    }`}
                  >
                    All
                  </button>
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setEventTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors active:scale-95 ${
                        eventTypeFilter === t ? CHIP_ACTIVE : CHIP_IDLE
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chapter */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Chapter</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setChapterFilter("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors active:scale-95 ${
                      chapterFilter === "all" ? CHIP_ACTIVE : CHIP_IDLE
                    }`}
                  >
                    All
                  </button>
                  {CHAPTERS.map((chapter) => (
                    <button
                      key={chapter}
                      onClick={() => setChapterFilter(chapter)}
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

        {/* Events grid */}
        {fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 text-red-400 gap-3 text-sm">
            {fetchError}
          </div>
        ) : isFilteredEmpty ? (
          /* ── Filtered empty: compact, inline ── */
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-surface border border-border">
            <p className="text-sm text-text-secondary">No events match your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
                setEventTypeFilter("all");
                setChapterFilter("all");
              }}
              className="text-sm text-accent-highlight hover:text-accent-primary font-medium transition-colors shrink-0"
            >
              Clear filters
            </button>
          </div>
        ) : isTrulyEmpty ? (
          /* ── Truly empty: designed, role-aware ── */
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            {/* Icon backdrop */}
            <div className="w-16 h-16 rounded-2xl bg-accent-primary/15 flex items-center justify-center animate-float">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent-highlight"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>

            {/* Copy */}
            <div className="flex flex-col gap-2 max-w-xs">
              <h3 className="font-heading text-xl text-text-primary">
                {userData?.role === "coordinator"
                  ? "No events posted yet"
                  : "No events yet"}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {userData?.role === "coordinator"
                  ? "Post your chapter's first event and let volunteers start earning XP."
                  : "Your coordinator will post events here when they're ready. In the meantime, keep leveling up on your quest map."}
              </p>
            </div>

            {/* CTA */}
            {userData?.role === "coordinator" ? (
              <Link
                href="/events/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-accent-highlight hover:bg-accent-primary rounded-xl text-white text-sm font-heading font-medium transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Post your first event
              </Link>
            ) : (
              <Link
                href="/quests"
                className="flex items-center gap-1.5 px-4 py-2.5 border border-border hover:border-accent-primary/50 rounded-xl text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
              >
                Explore Quest Map
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Upcoming section */}
            {upcomingFiltered.length > 0 && (
              <>
                {hasBoth && (
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-xs text-text-secondary uppercase tracking-widest">
                      Upcoming
                    </span>
                    <span className="text-xs text-text-muted tabular-nums">
                      {upcomingFiltered.length}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingFiltered.map((event, i) => (
                    <EventCard
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

            {/* Past section */}
            {pastFiltered.length > 0 && (
              <>
                <div className={`flex items-center gap-3 ${hasBoth ? "mt-4" : ""}`}>
                  {hasBoth && (
                    <span className="font-heading text-xs text-text-muted uppercase tracking-widest">
                      Past
                    </span>
                  )}
                  {hasBoth && (
                    <span className="text-xs text-text-muted tabular-nums">
                      {pastFiltered.length}
                    </span>
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
        )}
        </div>
      </div>
    </PageShell>
  );
}
