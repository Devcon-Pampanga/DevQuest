"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";
import { TEAM_META } from "@/lib/seed/quests";
import { getXpLevelProgress } from "@/lib/xpLevel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvatarOptions {
  backgroundColor: string;
  backgroundType: "solid" | "gradientLinear";
  eyes: string;
  mouth: string;
}

interface CurrentUser {
  uid: string;
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  xp: number;
  teams: string[];
  avatarOptions?: AvatarOptions;
}

interface ChapterVolunteer {
  uid: string;
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  xp: number;
  teams: string[];
  avatarOptions?: AvatarOptions;
}

interface EventDoc {
  eventId: string;
  name: string;
  date: Timestamp;
  location: string;
  chapterId: string;
  roles: { roleName: string; slots: number; xpReward: number }[];
  bannerUrl?: string;
  eventType?: string;
  isInternal?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const CHAPTER_REGIONS: Record<string, string> = {
  "DEVCON Kids Baguio": "CAR · Cordillera",
  "DEVCON Kids Cagayan de Oro": "Region X · Northern Mindanao",
  "DEVCON Kids Cebu": "Region VII · Central Visayas",
  "DEVCON Kids Davao": "Region XI · Davao Region",
  "DEVCON Kids Iloilo": "Region VI · Western Visayas",
  "DEVCON Kids Manila": "NCR · Metro Manila",
  "DEVCON Kids Pampanga": "Region III · Central Luzon",
  "DEVCON Kids Quezon City": "NCR · Metro Manila",
  "DEVCON Kids Tacloban": "Region VIII · Eastern Visayas",
  "DEVCON Kids Zamboanga": "Region IX · Zamboanga Peninsula",
};

const DEFAULT_AVATAR: AvatarOptions = {
  backgroundColor: "5e35b1",
  backgroundType: "solid",
  eyes: "round",
  mouth: "smile01",
};

const MEDAL_COLORS = ["#F5C518", "#A1A1AA", "#CD7F32"] as const;
const MEDAL_LABELS = ["Master of Season", "Silver Medal", "Bronze Medal"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function totalSlots(roles: { roleName: string; slots: number; xpReward: number }[]): number {
  return roles.reduce((sum, r) => sum + r.slots, 0);
}

function shortChapter(name: string): string {
  return name.replace(/^DEVCON Kids\s+/i, "");
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function VolunteerAvatar({
  username,
  opts,
  size = 36,
}: {
  username: string;
  opts?: AvatarOptions;
  size?: number;
}) {
  const url = buildAvatarUrl(username, opts ?? DEFAULT_AVATAR);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={username}
      width={size}
      height={size}
      className="rounded-xl border border-border object-cover shrink-0"
      style={{ width: size, height: size, minWidth: size }}
    />
  );
}

// ─── Team Badge ───────────────────────────────────────────────────────────────

function TeamBadge({ teamId }: { teamId: string }) {
  const meta = TEAM_META[teamId];
  if (!meta) return null;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wide whitespace-nowrap"
      style={{
        backgroundColor: meta.color + "22",
        color: meta.color,
        border: `1px solid ${meta.color}44`,
      }}
    >
      {meta.label}
    </span>
  );
}

// ─── Chapter Hero ─────────────────────────────────────────────────────────────

function ChapterHero({
  chapterId,
  canEdit,
  onEdit,
}: {
  chapterId: string;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const region = CHAPTER_REGIONS[chapterId] ?? "Philippines";

  return (
    <div
      className="relative rounded-2xl overflow-hidden animate-fade-up"
      style={{
        background: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 45%, #A855F7 80%, #C084FC 100%)",
        animationDelay: "0ms",
      }}
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* Glow orb */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-purple-200/60 text-[10px] font-sans uppercase tracking-[0.18em] mb-2">
            Chapter
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl text-white leading-tight">
            {chapterId}
          </h2>
          <div className="flex items-center gap-1.5 mt-2.5 text-purple-100/70 text-sm">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{region}</span>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-heading transition-colors backdrop-blur-sm border border-white/20 shrink-0"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatsCard({
  label,
  value,
  color,
  icon,
  delay = 0,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="rounded-2xl bg-surface border border-border p-4 sm:p-5 flex flex-col gap-3 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-muted font-sans uppercase tracking-widest leading-none">
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "1a" }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div
        className="font-heading text-3xl tabular-nums leading-none"
        style={{ color }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="h-0.5 rounded-full w-10" style={{ backgroundColor: color + "80" }} />
    </div>
  );
}

// ─── Coordinators Section (1 or many, with carousel) ─────────────────────────

function CoordinatorsSection({ coordinators }: { coordinators: ChapterVolunteer[] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Clamp activeIdx whenever coordinators list changes (e.g. chapter switch)
  useEffect(() => {
    if (coordinators.length > 0 && activeIdx >= coordinators.length) {
      setActiveIdx(0);
    }
  }, [coordinators.length, activeIdx]);

  const safeIdx = Math.min(activeIdx, Math.max(0, coordinators.length - 1));
  const active = coordinators[safeIdx] ?? null;
  const isMultiple = coordinators.length > 1;
  const primaryTeam = active?.teams?.[0] ?? null;
  const teamMeta = primaryTeam ? (TEAM_META[primaryTeam] ?? null) : null;
  const accentColor = teamMeta?.color ?? "#A855F7";

  const avatarUrl = active
    ? buildAvatarUrl(active.username, active.avatarOptions ?? DEFAULT_AVATAR)
    : "";

  function goTo(idx: number) {
    setActiveIdx(idx);
  }

  function goPrev() {
    setActiveIdx((i) => (i - 1 + coordinators.length) % coordinators.length);
  }

  function goNext() {
    setActiveIdx((i) => (i + 1) % coordinators.length);
  }

  if (!active) return null;

  // ── Single coordinator: original clean card ───────────────────────────────
  if (!isMultiple) {
    return (
      <div
        className="rounded-2xl bg-surface border border-border p-5 flex items-center gap-4 animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={active.username}
          width={52}
          height={52}
          className="rounded-xl border-2 border-accent-primary/40 shrink-0 object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-sans uppercase tracking-[0.16em] text-accent-highlight mb-1">
            Chapter Coordinator
          </div>
          <div className="font-heading text-base text-text-primary truncate">
            {active.username}
          </div>
          <div className="text-xs text-text-muted mt-0.5">DEVCON Kids</div>
        </div>
      </div>
    );
  }

  // ── Multiple coordinators: carousel ──────────────────────────────────────
  return (
    <div
      className="rounded-2xl bg-surface border border-border overflow-hidden animate-fade-up relative"
      style={{ animationDelay: "120ms" }}
    >
      {/* Subtle team-color gradient top strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-500"
        style={{ backgroundColor: accentColor }}
      />

      {/* Subtle background glow */}
      <div
        className="absolute -top-6 -right-6 w-40 h-40 rounded-full blur-3xl opacity-[0.06] pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative p-5 flex flex-col gap-0">
        {/* ── Header row ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-highlight shrink-0">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-accent-highlight">
              {isMultiple ? "Chapter Coordinators" : "Chapter Coordinator"}
            </span>
          </div>
          {isMultiple && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-highlight font-sans border border-accent-primary/20 tabular-nums">
              {safeIdx + 1} / {coordinators.length}
            </span>
          )}
        </div>

        {/* ── Active coordinator card ───────────────────────────────────────── */}
        <div
          key={safeIdx}
          className="flex items-center gap-4 animate-fade-up"
          style={{ animationDuration: "220ms" }}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="absolute inset-0 rounded-xl blur-md opacity-30 transition-colors duration-500"
              style={{ backgroundColor: accentColor }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt={active.username}
              width={56}
              height={56}
              className="relative rounded-xl border-2 object-cover transition-colors duration-500"
              style={{ borderColor: accentColor + "70" }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${active.username}`}
              className="font-heading text-base text-text-primary hover:text-accent-highlight transition-colors truncate block"
            >
              {active.username}
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-text-muted">DEVCON Kids</span>
              {teamMeta && (
                <>
                  <span className="text-text-muted text-xs">·</span>
                  <span
                    className="text-[10px] font-heading font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{
                      color: accentColor,
                      backgroundColor: accentColor + "18",
                    }}
                  >
                    {teamMeta.label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Multi-coordinator controls ────────────────────────────────────── */}
        {isMultiple && (
          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border/60">
            {/* Avatar thumbnail row — click to jump */}
            <div className="flex items-center gap-1.5">
              {coordinators.map((c, i) => {
                const url = buildAvatarUrl(c.username, c.avatarOptions ?? DEFAULT_AVATAR);
                const isMeta = c.teams?.[0] ? (TEAM_META[c.teams[0]] ?? null) : null;
                const isActive = i === safeIdx;
                return (
                  <button
                    key={c.uid}
                    onClick={() => goTo(i)}
                    title={c.username}
                    className="relative group transition-all duration-200 active:scale-90"
                    style={{ transform: isActive ? "scale(1.1)" : "scale(1)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={c.username}
                      width={28}
                      height={28}
                      className="rounded-lg object-cover transition-all duration-200"
                      style={{
                        border: `2px solid ${isActive ? (isMeta?.color ?? "#A855F7") : "transparent"}`,
                        opacity: isActive ? 1 : 0.35,
                        filter: isActive ? "none" : "grayscale(40%)",
                      }}
                    />
                    {/* Active dot */}
                    {isActive && (
                      <span
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isMeta?.color ?? "#A855F7" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Prev / Next buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={goPrev}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors active:scale-90"
                aria-label="Previous coordinator"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={goNext}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors active:scale-90"
                aria-label="Next coordinator"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Event Carousel Item ──────────────────────────────────────────────────────

function EventCarouselItem({
  event,
  regCount,
}: {
  event: EventDoc;
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

// ─── Volunteer Row ────────────────────────────────────────────────────────────

function VolunteerRow({
  volunteer,
  index,
  canRemove,
  onRemove,
  isCurrentUser,
}: {
  volunteer: ChapterVolunteer;
  index: number;
  canRemove: boolean;
  onRemove: (uid: string) => void;
  isCurrentUser: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { level } = getXpLevelProgress(volunteer.xp);
  const primaryTeamMeta = volunteer.teams[0] ? TEAM_META[volunteer.teams[0]] : null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors animate-fade-up"
      style={{
        animationDelay: `${index * 35}ms`,
        backgroundColor: isCurrentUser ? "rgba(124,58,237,0.07)" : "transparent",
        borderColor: isCurrentUser ? "rgba(124,58,237,0.25)" : "rgba(39,39,42,0.5)",
      }}
    >
      <Link
        href={`/profile/${volunteer.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <VolunteerAvatar username={volunteer.username} opts={volunteer.avatarOptions} size={40} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm text-text-primary truncate">
              {volunteer.username}
            </span>
            {isCurrentUser && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans uppercase tracking-wide shrink-0">
                you
              </span>
            )}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5">Lvl {level}</div>
        </div>

        {/* Teams (desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {volunteer.teams.slice(0, 2).map((t) => (
            <TeamBadge key={t} teamId={t} />
          ))}
          {volunteer.teams.length > 2 && (
            <span className="text-[10px] text-text-muted">+{volunteer.teams.length - 2}</span>
          )}
        </div>

        {/* XP */}
        <div
          className="shrink-0 text-sm font-heading tabular-nums hidden md:block"
          style={{ color: primaryTeamMeta?.color ?? "#A855F7" }}
        >
          +{volunteer.xp.toLocaleString()} XP
        </div>
      </Link>

      {/* ⋯ menu */}
      {canRemove && volunteer.role !== "coordinator" && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            aria-label="Volunteer options"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 rounded-xl border border-border bg-elevated py-1 min-w-[160px] animate-modal-in shadow-2xl">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRemove(volunteer.uid);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Remove volunteer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Leaderboard Item ─────────────────────────────────────────────────────────

function LeaderboardItem({
  volunteer,
  rank,
  isCurrentUser,
  index,
}: {
  volunteer: ChapterVolunteer;
  rank: number;
  isCurrentUser: boolean;
  index: number;
}) {
  const isTopThree = rank <= 3;
  const medalColor = MEDAL_COLORS[rank - 1];
  const primaryTeamMeta = volunteer.teams[0] ? TEAM_META[volunteer.teams[0]] : null;

  if (isTopThree) {
    return (
      <div
        className="rounded-xl p-3 flex items-center gap-3 border animate-fade-up"
        style={{
          animationDelay: `${index * 40}ms`,
          backgroundColor: isCurrentUser
            ? "rgba(124,58,237,0.1)"
            : `${medalColor}12`,
          borderColor: isCurrentUser
            ? "rgba(124,58,237,0.35)"
            : `${medalColor}2e`,
        }}
      >
        {/* Medal / rank */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: medalColor + "20" }}
        >
          {rank === 1 ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill={medalColor} stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ) : (
            <span
              className="font-heading text-sm font-bold"
              style={{ color: medalColor }}
            >
              {rank}
            </span>
          )}
        </div>

        <Link
          href={`/profile/${volunteer.username}`}
          className="flex items-center gap-2.5 flex-1 min-w-0"
        >
          <VolunteerAvatar
            username={volunteer.username}
            opts={volunteer.avatarOptions}
            size={34}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-sm text-text-primary truncate">
                {volunteer.username}
              </span>
              {isCurrentUser && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans uppercase tracking-wide shrink-0">
                  you
                </span>
              )}
            </div>
            <div
              className="text-[9px] font-sans uppercase tracking-widest mt-0.5"
              style={{ color: medalColor + "99" }}
            >
              {MEDAL_LABELS[rank - 1]}
            </div>
          </div>
        </Link>

        <div
          className="shrink-0 font-heading text-sm tabular-nums"
          style={{ color: primaryTeamMeta?.color ?? "#A855F7" }}
        >
          {volunteer.xp.toLocaleString()} XP
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-2 py-2 rounded-xl border animate-fade-up"
      style={{
        animationDelay: `${index * 30}ms`,
        backgroundColor: isCurrentUser ? "rgba(124,58,237,0.07)" : "transparent",
        borderColor: isCurrentUser ? "rgba(124,58,237,0.25)" : "transparent",
      }}
    >
      <span className="w-5 text-center text-xs text-text-muted font-heading tabular-nums shrink-0">
        {rank}
      </span>
      <Link
        href={`/profile/${volunteer.username}`}
        className="flex items-center gap-2.5 flex-1 min-w-0"
      >
        <VolunteerAvatar
          username={volunteer.username}
          opts={volunteer.avatarOptions}
          size={30}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-sm text-text-primary truncate">
              {volunteer.username}
            </span>
            {isCurrentUser && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans uppercase tracking-wide shrink-0">
                you
              </span>
            )}
          </div>
        </div>
      </Link>
      <span className="shrink-0 text-sm text-text-secondary font-heading tabular-nums">
        {volunteer.xp.toLocaleString()} XP
      </span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChapterSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-6 pb-10">
      <SkeletonBlock className="h-36 rounded-2xl" />

      <div className="grid grid-cols-3 gap-6 lg:hidden">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <SkeletonBlock className="h-20 rounded-2xl" />
          <div className="flex flex-col gap-2">
            <SkeletonLine className="w-24" />
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl bg-[#1a1a2e] animate-pulse shrink-0" style={{ width: 210, height: 180 }} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SkeletonLine className="w-20" />
            <SkeletonBlock className="h-10 rounded-xl" />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-7 w-20 rounded-full" />)}
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonBlock key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-start-3 lg:col-span-1">
          <SkeletonBlock className="h-80 rounded-2xl" />
          <SkeletonBlock className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChapterPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [viewingChapterId, setViewingChapterId] = useState("");
  const [chapterDropdownOpen, setChapterDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [volunteers, setVolunteers] = useState<ChapterVolunteer[]>([]);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [loadingChapter, setLoadingChapter] = useState(true);

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [leaderboardTab, setLeaderboardTab] = useState<"chapter" | "all-time">("chapter");

  // Render-only pagination: we still fetch all volunteers for accurate search/filter,
  // but only render a single page worth of tiles at a time.
  const VOLUNTEER_PAGE_SIZE = 8;
  const [volunteerPage, setVolunteerPage] = useState(1);

  const [showEditModal, setShowEditModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ uid: string; username: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  // ── Auth guard ───────────────────────────────────────────────────────────────
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
      const data = snap.data() as CurrentUser;
      setCurrentUser({ ...data, uid: user.uid });
      setViewingChapterId(data.chapterId);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  // ── Close chapter dropdown on outside click ──────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setChapterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Fetch chapter data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewingChapterId) return;
    let cancelled = false;

    async function fetchChapterData() {
      setLoadingChapter(true);
      setSearch("");
      setTeamFilter("all");
      setVolunteers([]);
      setEvents([]);
      setRegCounts({});
      try {
        const [usersSnap, eventsSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), where("chapterId", "==", viewingChapterId))),
          getDocs(query(collection(db, "events"), where("chapterId", "==", viewingChapterId))),
        ]);

        if (cancelled) return;

        const vols = usersSnap.docs.map(
          (d) => ({ ...d.data(), uid: d.id } as ChapterVolunteer)
        );
        setVolunteers(vols);

        const evDocs = eventsSnap.docs
          .map((d) => ({ ...d.data(), eventId: d.id } as EventDoc))
          .sort((a, b) => b.date.toMillis() - a.date.toMillis());
        setEvents(evDocs);

        // Fetch registration counts for recent events
        const recentSlice = evDocs.slice(0, 12);
        const counts = await Promise.all(
          recentSlice.map(async (ev) => {
            const snap = await getCountFromServer(
              collection(db, "events", ev.eventId, "registrations")
            );
            return [ev.eventId, snap.data().count] as [string, number];
          })
        );
        if (!cancelled) {
          setRegCounts(Object.fromEntries(counts));
        }
      } catch (err) {
        console.error("Failed to fetch chapter data:", err);
      } finally {
        if (!cancelled) setLoadingChapter(false);
      }
    }

    fetchChapterData();
    return () => { cancelled = true; };
  }, [viewingChapterId]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const coordinators = useMemo(
    () => volunteers.filter((v) => v.role === "coordinator"),
    [volunteers]
  );

  const totalAttendees = useMemo(
    () => Object.values(regCounts).reduce((s, c) => s + c, 0),
    [regCounts]
  );

  const leaderboard = useMemo(
    () => [...volunteers].sort((a, b) => b.xp - a.xp),
    [volunteers]
  );

  const sortedVolunteers = useMemo(() => {
    return [...volunteers].sort((a, b) => a.username.localeCompare(b.username));
  }, [volunteers]);

  const filteredVolunteers = useMemo(() => {
    return sortedVolunteers
      .filter((v) => v.username.toLowerCase().includes(search.toLowerCase()))
      .filter((v) => teamFilter === "all" || v.teams.includes(teamFilter));
  }, [sortedVolunteers, search, teamFilter]);

  const volunteerTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredVolunteers.length / VOLUNTEER_PAGE_SIZE));
  }, [filteredVolunteers.length]);

  const pagedVolunteers = useMemo(() => {
    const start = (volunteerPage - 1) * VOLUNTEER_PAGE_SIZE;
    return filteredVolunteers.slice(start, start + VOLUNTEER_PAGE_SIZE);
  }, [filteredVolunteers, volunteerPage]);

  // Reset paging when filters change.
  useEffect(() => {
    setVolunteerPage(1);
  }, [search, teamFilter, viewingChapterId]);

  // Clamp page if results shrink.
  useEffect(() => {
    setVolunteerPage((p) => Math.min(Math.max(1, p), volunteerTotalPages));
  }, [volunteerTotalPages]);

  const teamBreakdown = useMemo(() => {
    const total = Math.max(1, volunteers.length);
    return Object.entries(TEAM_META).map(([id, meta]) => {
      const count = volunteers.filter((v) => v.teams.includes(id)).length;
      return { id, meta, count, pct: Math.round((count / total) * 100) };
    });
  }, [volunteers]);

  const isOwnChapter = currentUser?.chapterId === viewingChapterId;
  const canEdit = isOwnChapter && currentUser?.role === "coordinator";

  const avatarUrl = currentUser
    ? buildAvatarUrl(currentUser.username, currentUser.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  // ── Remove volunteer ─────────────────────────────────────────────────────────
  async function handleRemoveVolunteer() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await updateDoc(doc(db, "users", removeTarget.uid), { chapterId: "" });
      setVolunteers((prev) => prev.filter((v) => v.uid !== removeTarget.uid));
      setRemoveTarget(null);
    } catch (err) {
      console.error("Failed to remove volunteer:", err);
    } finally {
      setRemoving(false);
    }
  }

  const CHIP_BASE = "px-3 py-1 rounded-full text-xs font-heading font-medium border transition-all active:scale-95 flex items-center gap-1.5";
  const CHIP_IDLE = "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary";

  // ── Chapter dropdown (top bar action) ────────────────────────────────────────
  const chapterDropdownAction = (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setChapterDropdownOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-heading border transition-colors ${
          chapterDropdownOpen
            ? "bg-accent-primary/20 border-accent-primary text-accent-highlight"
            : "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary bg-surface"
        }`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="hidden sm:inline truncate max-w-[120px]">
          {viewingChapterId ? shortChapter(viewingChapterId) : "Chapter"}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {chapterDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl border border-border bg-elevated shadow-2xl py-2 min-w-[220px] animate-modal-in">
          {CHAPTERS.map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setViewingChapterId(ch);
                setChapterDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                viewingChapterId === ch
                  ? "text-accent-highlight bg-accent-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              <span>{ch}</span>
              {ch === currentUser?.chapterId && (
                <span className="text-[9px] text-accent-highlight font-sans uppercase tracking-wide">
                  yours
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <PageShell
      title="Chapter"
      avatarUrl={avatarUrl}
      loading={!authChecked || loadingChapter}
      skeleton={<ChapterSkeleton />}
      actions={authChecked ? chapterDropdownAction : undefined}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-10">

          {/* Chapter Hero — spans both columns */}
          <div className="lg:col-span-3">
            <ChapterHero
              chapterId={viewingChapterId}
              canEdit={canEdit}
              onEdit={() => setShowEditModal(true)}
            />
          </div>

          {/* Stats — spans both columns, internal 3-col grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-3 gap-6 lg:hidden">
              <StatsCard
                label="Events Hosted"
                value={events.length}
                color="#F5C518"
                delay={60}
                icon={
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
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
              />
              <StatsCard
                label="Active Volunteers"
                value={volunteers.length}
                color="#A855F7"
                delay={100}
                icon={
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
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
              />
              <StatsCard
                label="Total Attendees"
                value={totalAttendees}
                color="#22C55E"
                delay={140}
                icon={
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
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                }
              />
            </div>

            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
              <StatsCard
                label="Events Hosted"
                value={events.length}
                color="#F5C518"
                delay={60}
                icon={
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
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
              />
              <StatsCard
                label="Active Volunteers"
                value={volunteers.length}
                color="#A855F7"
                delay={100}
                icon={
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
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
              />
              <StatsCard
                label="Total Attendees"
                value={totalAttendees}
                color="#22C55E"
                delay={140}
                icon={
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
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* ── Left column (coordinator, events, volunteers) ── */}
          <div className="flex flex-col gap-6 lg:col-span-2">

              {/* Coordinator */}
              {coordinators.length > 0 && (
                <CoordinatorsSection coordinators={coordinators} />
              )}

              {/* Recent Events */}
              {events.length > 0 && (
                <div
                  className="flex flex-col gap-3 animate-fade-up"
                  style={{ animationDelay: "160ms" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-heading text-xs text-text-secondary uppercase tracking-widest">
                        Recent Events
                      </span>
                      <span className="text-xs text-text-muted tabular-nums">{events.length}</span>
                    </div>
                    <Link
                      href="/events"
                      className="text-xs text-accent-highlight hover:text-accent-primary font-medium transition-colors flex items-center gap-1"
                    >
                      See All
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-minimal -mx-1 px-1">
                    {events.slice(0, 12).map((ev) => (
                      <EventCarouselItem
                        key={ev.eventId}
                        event={ev}
                        regCount={regCounts[ev.eventId] ?? 0}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Volunteers */}
              <div
                className="flex flex-col gap-4 animate-fade-up"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs text-text-secondary uppercase tracking-widest">
                    Volunteers
                  </span>
                  <span className="text-xs text-text-muted tabular-nums">
                    {filteredVolunteers.length}
                    {filteredVolunteers.length !== volunteers.length && (
                      <> / {volunteers.length}</>
                    )}
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search volunteers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-colors"
                  />
                </div>

                {/* Team filter chips */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setTeamFilter("all")}
                    className={`${CHIP_BASE} ${teamFilter === "all" ? "border-accent-highlight bg-accent-highlight/10 text-accent-highlight" : CHIP_IDLE}`}
                  >
                    All Roles
                  </button>
                  {Object.entries(TEAM_META).map(([id, meta]) => {
                    const isActive = teamFilter === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setTeamFilter(id)}
                        className={`${CHIP_BASE} ${isActive ? "" : CHIP_IDLE}`}
                        style={isActive ? {
                          borderColor: meta.color,
                          backgroundColor: `${meta.color}1A`,
                          color: meta.color,
                        } : undefined}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: isActive ? meta.color : "currentColor", opacity: isActive ? 1 : 0.5 }}
                        />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>

                {/* Volunteer list */}
                {filteredVolunteers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="w-10 h-10 rounded-xl bg-border/50 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <p className="text-sm text-text-muted">
                      {volunteers.length === 0
                        ? "No volunteers in this chapter yet."
                        : "No volunteers match your search."}
                    </p>
                    {search || teamFilter !== "all" ? (
                      <button
                        onClick={() => { setSearch(""); setTeamFilter("all"); }}
                        className="text-xs text-accent-highlight hover:text-accent-primary transition-colors"
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {pagedVolunteers.map((v, i) => (
                      <VolunteerRow
                        key={`${teamFilter}-${v.uid}`}
                        volunteer={v}
                        index={(volunteerPage - 1) * VOLUNTEER_PAGE_SIZE + i}
                        canRemove={canEdit}
                        onRemove={(uid) => {
                          const vol = volunteers.find((vv) => vv.uid === uid);
                          if (vol) setRemoveTarget({ uid, username: vol.username });
                        }}
                        isCurrentUser={v.uid === currentUser?.uid}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination controls */}
                {filteredVolunteers.length > VOLUNTEER_PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                    <button
                      onClick={() => setVolunteerPage((p) => Math.max(1, p - 1))}
                      disabled={volunteerPage <= 1}
                      className="px-3 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-heading"
                    >
                      Prev
                    </button>
                    <span className="text-xs text-text-muted font-sans tabular-nums">
                      Page {volunteerPage} of {volunteerTotalPages}
                    </span>
                    <button
                      onClick={() => setVolunteerPage((p) => Math.min(volunteerTotalPages, p + 1))}
                      disabled={volunteerPage >= volunteerTotalPages}
                      className="px-3 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-heading"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

            </div>{/* end left column */}

            {/* ── Right column ── */}
            <div className="flex flex-col gap-6 lg:col-start-3 lg:col-span-1">

              {/* Leaderboard */}
              <div
                className="rounded-2xl bg-surface border border-border p-5 flex flex-col gap-4 animate-fade-up"
                style={{ animationDelay: "180ms" }}
              >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#F5C518" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="font-heading text-sm text-text-primary uppercase tracking-widest">
                  Leaderboard
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30 text-yellow-400/60 font-sans uppercase tracking-wide">
                Season 1
              </span>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-elevated p-1 gap-1">
              {(["chapter", "all-time"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLeaderboardTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-heading font-medium transition-colors ${
                    leaderboardTab === tab
                      ? "bg-accent-highlight text-white"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab === "chapter" ? "Chapter" : "All-Time"}
                </button>
              ))}
            </div>

            {/* Meta line */}
            {leaderboard.length > 0 && (
              <p className="text-[11px] text-text-muted -mt-1">
                {shortChapter(viewingChapterId)} · {leaderboard.length} volunteer
                {leaderboard.length !== 1 ? "s" : ""}
              </p>
            )}

            {/* Items */}
            <div className="flex flex-col gap-1.5">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">
                  No volunteers yet.
                </div>
              ) : (
                leaderboard.slice(0, 10).map((v, i) => (
                  <div
                    key={v.uid}
                    className={
                      i >= 8 ? "hidden lg:block" : i >= 5 ? "hidden sm:block" : undefined
                    }
                  >
                    <LeaderboardItem
                      volunteer={v}
                      rank={i + 1}
                      isCurrentUser={v.uid === currentUser?.uid}
                      index={i}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Overflow count */}
            {leaderboard.length > 8 && (
              <Link
                href={`/leaderboard?chapter=${encodeURIComponent(viewingChapterId)}`}
                className="hidden sm:block lg:hidden text-center text-xs text-text-muted hover:text-accent-highlight transition-colors"
              >
                +{leaderboard.length - 8} more volunteers
              </Link>
            )}
            {leaderboard.length > 5 && (
              <Link
                href={`/leaderboard?chapter=${encodeURIComponent(viewingChapterId)}`}
                className="sm:hidden text-center text-xs text-text-muted hover:text-accent-highlight transition-colors"
              >
                +{leaderboard.length - 5} more volunteers
              </Link>
            )}
            {leaderboard.length > 10 && (
              <Link
                href={`/leaderboard?chapter=${encodeURIComponent(viewingChapterId)}`}
                className="hidden lg:block text-center text-xs text-text-muted hover:text-accent-highlight transition-colors"
              >
                +{leaderboard.length - 10} more volunteers
              </Link>
            )}

            {/* View Full Leaderboard */}
            <Link
              href={`/leaderboard?chapter=${encodeURIComponent(viewingChapterId)}`}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-accent-primary/40 bg-accent-primary/10 hover:bg-accent-primary/20 hover:border-accent-primary/60 text-accent-highlight text-xs font-heading font-semibold transition-all group"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              View Full Leaderboard
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-150">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

              {/* Team Breakdown */}
              <div
                className="rounded-2xl bg-surface border border-border p-5 flex flex-col gap-4 animate-fade-up"
                style={{ animationDelay: "220ms" }}
              >
                <span className="font-heading text-sm text-text-primary uppercase tracking-widest">
                  Team Breakdown
                </span>

                <div className="flex flex-col gap-3.5">
                  {teamBreakdown.map(({ id, meta, count, pct }) => (
                    <div key={id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary font-sans">{meta.label}</span>
                        <span
                          className="font-heading tabular-nums"
                          style={{ color: meta.color }}
                        >
                          {count > 0 ? `${pct}%` : "—"}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: meta.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-text-muted">
                  Volunteers per team · {volunteers.length} total
                </p>
              </div>

            </div>{/* end right column */}

          </div>{/* end 2-col grid */}

        </div>

      {/* ── Edit Chapter Modal ──────────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl bg-elevated border border-border w-full max-w-md p-6 flex flex-col gap-5 animate-modal-in shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg text-text-primary">Edit Chapter Info</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="rounded-xl bg-accent-primary/10 border border-accent-primary/20 px-4 py-3">
              <p className="text-sm text-text-secondary leading-relaxed">
                Chapter details are managed by DEVCON PH administrators. Contact your regional
                admin to update chapter name, region, or coordinator information.
              </p>
            </div>

            <button
              onClick={() => setShowEditModal(false)}
              className="w-full py-2.5 rounded-xl bg-accent-highlight hover:bg-accent-primary text-white text-sm font-heading font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Remove Volunteer Confirmation ───────────────────────────────────────── */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl bg-elevated border border-border w-full max-w-sm p-6 flex flex-col gap-5 animate-modal-in shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading text-base text-text-primary">Remove Volunteer</h3>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  Remove{" "}
                  <span className="text-text-primary font-medium">{removeTarget.username}</span>{" "}
                  from this chapter? They will no longer appear in chapter stats or leaderboards.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                disabled={removing}
                className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary text-sm font-heading transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveVolunteer}
                disabled={removing}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-heading font-medium transition-colors border border-red-500/30 disabled:opacity-50"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
