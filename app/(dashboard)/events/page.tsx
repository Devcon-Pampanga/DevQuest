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
import { useSidebar } from "@/context/SidebarContext";

const WAVE_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];

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
}: {
  event: EventDoc;
  registeredCount: number;
  countLoading: boolean;
}) {
  const upcoming = isUpcoming(event.date);
  const total = totalSlots(event.roles);
  const remaining = Math.max(0, total - registeredCount);
  const pct = total > 0 ? Math.min(100, (registeredCount / total) * 100) : 0;

  return (
    <Link
      href={`/events/${event.eventId}`}
      className="rounded-2xl bg-surface border border-border overflow-hidden flex flex-col hover:border-accent-primary/50 transition-colors duration-200 cursor-pointer"
    >
      {/* Banner */}
      <div className="relative h-36 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.bannerUrl ?? "/event-banner-placeholder.png"}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {!event.bannerUrl && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: upcoming
                ? "linear-gradient(135deg, #7C3AED, #A855F7)"
                : "rgba(39,39,42,0.8)",
            }}
          />
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Status chip + name */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
              upcoming
                ? "bg-green-500/15 text-green-400"
                : "bg-zinc-700/40 text-zinc-400"
            }`}
          >
            {upcoming ? "UPCOMING" : "PAST"}
          </span>
          {event.isInternal && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-700/50 text-zinc-300 font-medium shrink-0">
              Internal
            </span>
          )}
        </div>

        <h2 className="font-heading text-lg text-text-primary leading-tight">
          {event.name}
        </h2>

        {/* Date */}
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatEventDate(event.date)}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="line-clamp-1">{event.location}</span>
        </div>

        {/* Slots */}
        <div className="mt-auto pt-1">
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
          <div className="h-1.5 rounded-full bg-border mb-1">
            <div
              className="h-full rounded-full bg-accent-primary transition-all duration-500"
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
  const { openSidebar } = useSidebar();

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
        const docs = snapshot.docs
          .map((d) => ({ eventId: d.id, ...d.data() }) as EventDoc)
          .sort((a, b) => a.date.toMillis() - b.date.toMillis());
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

  if (!authChecked || !userData) return null;

  const avatarUrl = buildAvatarUrl(
    userData.username,
    userData.avatarOptions ?? DEFAULT_AVATAR
  );

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
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-base">
        <div className="flex items-center gap-2">
          <button
            onClick={openSidebar}
            className="lg:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="font-heading text-2xl text-text-primary tracking-wide">
            Events
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {userData.role === "coordinator" && (
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
          )}


          {/* Avatar → dashboard */}
          <Link href="/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt="Profile"
              width={36}
              height={36}
              className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors"
            />
          </Link>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-5">
        {/* Search + filter button */}
        <div className="relative" ref={filterRef}>
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
              className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl border border-border p-5 flex flex-col gap-5"
              style={{ backgroundColor: "#1e1a2e" }}
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
                      className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors ${
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
                    className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors ${
                      eventTypeFilter === "all" ? CHIP_ACTIVE : CHIP_IDLE
                    }`}
                  >
                    All
                  </button>
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setEventTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors ${
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
                    className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors ${
                      chapterFilter === "all" ? CHIP_ACTIVE : CHIP_IDLE
                    }`}
                  >
                    All
                  </button>
                  {CHAPTERS.map((chapter) => (
                    <button
                      key={chapter}
                      onClick={() => setChapterFilter(chapter)}
                      className={`px-3 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors ${
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
        {loadingEvents ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex gap-2">
              {WAVE_COLORS.map((color, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 text-red-400 gap-3 text-sm">
            {fetchError}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-3">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="text-sm">No events found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((event) => (
              <EventCard
                key={event.eventId}
                event={event}
                registeredCount={registrationCounts[event.eventId] ?? 0}
                countLoading={countsLoading}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
