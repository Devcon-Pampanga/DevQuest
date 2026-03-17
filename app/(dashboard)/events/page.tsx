"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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
}

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

function EventCard({ event }: { event: EventDoc }) {
  const upcoming = isUpcoming(event.date);
  const slots = totalSlots(event.roles);

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
        {/* Upcoming/past tint overlay when using placeholder */}
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
        <div className="flex items-start justify-between gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
              upcoming
                ? "bg-green-500/15 text-green-400"
                : "bg-zinc-700/40 text-zinc-400"
            }`}
          >
            {upcoming ? "UPCOMING" : "PAST"}
          </span>
        </div>

        <h2 className="font-heading text-lg text-text-primary leading-tight">
          {event.name}
        </h2>

        {/* Date */}
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
          <span>{formatEventDate(event.date)}</span>
        </div>

        {/* Location */}
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

        {/* Slots */}
        <div className="mt-auto pt-1">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-text-secondary">Slots Available</span>
            <span className="text-accent-highlight font-semibold">{slots}</span>
          </div>
          <div className="h-1.5 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent-primary"
              style={{ width: upcoming ? "60%" : "100%" }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

type FilterType = "all" | "upcoming" | "past";

export default function EventsPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

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

  // ── Fetch events ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userData) return;

    async function fetchEvents() {
      setLoadingEvents(true);
      try {
        const q = query(
          collection(db, "events"),
          where("chapterId", "==", userData!.chapterId)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs
          .map((d) => ({ eventId: d.id, ...d.data() }) as EventDoc)
          .sort((a, b) => a.date.toMillis() - b.date.toMillis());
        setEvents(docs);
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
      .filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      )
      .filter((e) => {
        if (activeFilter === "upcoming") return e.date.toDate() > now;
        if (activeFilter === "past") return e.date.toDate() <= now;
        return true;
      });
  }, [events, search, activeFilter]);

  if (!authChecked || !userData) return null;

  const avatarUrl = buildAvatarUrl(
    userData.username,
    userData.avatarOptions ?? DEFAULT_AVATAR
  );

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="font-heading text-2xl text-text-primary tracking-wide pl-10 lg:pl-0">
          Events
        </h1>

        <div className="flex items-center gap-3">
          {userData.role === "coordinator" && (
            <Link
              href="/events/new"
              className="flex items-center gap-2 px-4 py-2 bg-accent-highlight hover:bg-accent-primary rounded-xl text-white text-sm font-heading font-medium transition-colors"
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

          {/* Bell */}
          <Link
            href="/notifications"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors relative"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </Link>

          {/* Avatar → dashboard */}
          <Link href="/dashboard">
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
      <div className="flex-1 p-6">
        {/* Search + filters */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Search bar */}
          <div className="relative">
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

          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors ${
                  activeFilter === key
                    ? "bg-accent-highlight border-accent-highlight text-white"
                    : "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Events grid */}
        {loadingEvents ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-accent-highlight animate-[wave-dot_0.6s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 0.15}s` }}
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
              <EventCard key={event.eventId} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
