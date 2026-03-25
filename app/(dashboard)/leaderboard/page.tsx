"use client";

import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageShell, { SkeletonBlock, SkeletonLine } from "@/components/layout/PageShell";
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

interface Volunteer {
  uid: string;
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  xp: number;
  teams: string[];
  avatarOptions?: AvatarOptions;
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

const MEDAL_COLORS: Record<1 | 2 | 3, string> = {
  1: "#F5C518",
  2: "#A1A1AA",
  3: "#CD7F32",
};

const PODIUM_HEIGHTS: Record<1 | 2 | 3, number> = { 1: 88, 2: 60, 3: 44 };
const AVATAR_SIZES: Record<1 | 2 | 3, number> = { 1: 72, 2: 56, 3: 48 };

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

function shortChapter(name: string): string {
  return name.replace(/^DEVCON Kids\s+/i, "");
}

// ─── Podium Slot ──────────────────────────────────────────────────────────────

function PodiumSlot({
  volunteer,
  rank,
  isCurrentUser,
}: {
  volunteer: Volunteer | undefined;
  rank: 1 | 2 | 3;
  isCurrentUser: boolean;
}) {
  const color = MEDAL_COLORS[rank];
  const blockH = PODIUM_HEIGHTS[rank];
  const avatarSize = AVATAR_SIZES[rank];
  const delay = rank === 1 ? 120 : rank === 2 ? 60 : 0;
  const primaryTeamMeta = volunteer?.teams[0] ? TEAM_META[volunteer.teams[0]] : null;

  if (!volunteer) {
    return (
      <div className="flex flex-col items-center gap-3 flex-1">
        <div
          className="rounded-xl bg-border/20 animate-pulse"
          style={{ width: avatarSize, height: avatarSize }}
        />
        <div className="text-center">
          <SkeletonLine className="w-20 mx-auto" />
        </div>
        <div
          className="w-full rounded-t-xl"
          style={{
            height: blockH,
            background: `${color}08`,
            borderTop: `2px solid ${color}15`,
          }}
        />
      </div>
    );
  }

  const { level } = getXpLevelProgress(volunteer.xp);
  const avatarUrl = buildAvatarUrl(volunteer.username, volunteer.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div
      className="flex flex-col items-center flex-1 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Avatar with glow ring */}
      <div className="relative mb-3">
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-xl blur-md opacity-40"
          style={{ backgroundColor: color, transform: "scale(1.15)" }}
        />
        {/* Avatar */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={volunteer.username}
          width={avatarSize}
          height={avatarSize}
          className="relative rounded-xl object-cover border-2"
          style={{
            borderColor: color,
            width: avatarSize,
            height: avatarSize,
            minWidth: avatarSize,
          }}
        />
        {/* Rank badge pinned to bottom-center */}
        <div
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-base flex items-center justify-center shadow-lg"
          style={{ backgroundColor: color }}
        >
          {rank === 1 ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ) : (
            <span className="font-heading text-[10px] text-white font-bold">{rank}</span>
          )}
        </div>
      </div>

      {/* Name + info */}
      <div className="text-center mt-1 mb-3 px-1">
        <Link
          href={`/profile/${volunteer.username}`}
          className="font-heading text-sm text-text-primary hover:text-accent-highlight transition-colors truncate block max-w-[96px]"
        >
          {volunteer.username}
        </Link>
        {isCurrentUser && (
          <span className="inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans uppercase tracking-wide mt-0.5">
            you
          </span>
        )}
        <div
          className="font-heading text-sm tabular-nums mt-0.5"
          style={{ color: primaryTeamMeta?.color ?? color }}
        >
          {volunteer.xp.toLocaleString()} XP
        </div>
        {volunteer.teams[0] && (
          <div
            className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-heading font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: (primaryTeamMeta?.color ?? color) + "20",
              color: primaryTeamMeta?.color ?? color,
            }}
          >
            {primaryTeamMeta?.label ?? ""}
          </div>
        )}
      </div>

      {/* Podium block */}
      <div
        className="w-full rounded-t-xl flex items-end justify-center pb-2"
        style={{
          height: blockH,
          background: `linear-gradient(to bottom, ${color}20, ${color}08)`,
          borderTop: `2px solid ${color}50`,
        }}
      >
        <span className="text-[10px] font-sans text-text-muted tabular-nums">Lvl {level}</span>
      </div>
    </div>
  );
}

// ─── Your Rank Card ───────────────────────────────────────────────────────────

function YourRankCard({
  volunteer,
  rank,
  total,
  xpToNext,
}: {
  volunteer: Volunteer;
  rank: number;
  total: number;
  xpToNext: number;
}) {
  const primaryTeamMeta = volunteer.teams[0] ? TEAM_META[volunteer.teams[0]] : null;
  const color = primaryTeamMeta?.color ?? "#A855F7";
  const { pctToNextLevel } = getXpLevelProgress(volunteer.xp);
  const avatarUrl = buildAvatarUrl(volunteer.username, volunteer.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div
      className="rounded-2xl border p-4 flex items-center gap-4 animate-fade-up relative overflow-hidden"
      style={{
        borderColor: color + "40",
        background: `linear-gradient(135deg, ${color}0d 0%, transparent 60%)`,
        animationDelay: "0ms",
      }}
    >
      {/* Subtle glow */}
      <div
        className="absolute -top-8 -left-8 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      {/* Rank number */}
      <div className="shrink-0 text-center min-w-[48px]">
        <div
          className="font-heading text-3xl tabular-nums leading-none"
          style={{ color }}
        >
          #{rank}
        </div>
        <div className="text-[10px] text-text-muted font-sans mt-0.5">
          of {total}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 shrink-0" style={{ backgroundColor: color + "30" }} />

      {/* Avatar + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={volunteer.username}
          width={40}
          height={40}
          className="rounded-xl border shrink-0 object-cover"
          style={{ borderColor: color + "50" }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-sm text-text-primary truncate">
              {volunteer.username}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans uppercase tracking-wide shrink-0">
              you
            </span>
          </div>
          {/* XP bar */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pctToNextLevel}%`, backgroundColor: color }}
              />
            </div>
            <span
              className="text-[10px] font-heading tabular-nums shrink-0"
              style={{ color }}
            >
              {volunteer.xp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      {/* XP to next rank (if not #1) */}
      {rank > 1 && xpToNext > 0 && (
        <div className="shrink-0 text-right hidden sm:block">
          <div className="text-[10px] text-text-muted font-sans leading-tight">
            {xpToNext.toLocaleString()} XP
          </div>
          <div className="text-[10px] text-text-muted font-sans leading-tight">
            to #{rank - 1}
          </div>
        </div>
      )}
      {rank === 1 && (
        <div
          className="shrink-0 text-[10px] font-sans uppercase tracking-wide hidden sm:block"
          style={{ color: MEDAL_COLORS[1] }}
        >
          #1 · Top rank
        </div>
      )}
    </div>
  );
}

// ─── Rank Row (position 4+) ───────────────────────────────────────────────────

function RankRow({
  volunteer,
  rank,
  isCurrentUser,
  index,
}: {
  volunteer: Volunteer;
  rank: number;
  isCurrentUser: boolean;
  index: number;
}) {
  const { level } = getXpLevelProgress(volunteer.xp);
  const primaryTeamMeta = volunteer.teams[0] ? TEAM_META[volunteer.teams[0]] : null;
  const avatarUrl = buildAvatarUrl(volunteer.username, volunteer.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors animate-fade-up group"
      style={{
        animationDelay: `${180 + index * 30}ms`,
        backgroundColor: isCurrentUser ? "rgba(124,58,237,0.07)" : "transparent",
        borderColor: isCurrentUser ? "rgba(124,58,237,0.25)" : "rgba(39,39,42,0.5)",
      }}
    >
      {/* Rank */}
      <span className="w-7 text-right text-sm text-text-muted font-heading tabular-nums shrink-0">
        {rank}
      </span>

      {/* Avatar + name */}
      <Link
        href={`/profile/${volunteer.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={volunteer.username}
          width={36}
          height={36}
          className="rounded-xl border border-border object-cover shrink-0 group-hover:border-accent-primary/40 transition-colors"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm text-text-primary truncate group-hover:text-accent-highlight transition-colors">
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
      </Link>

      {/* Team badge (desktop) */}
      {primaryTeamMeta && (
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: primaryTeamMeta.color + "22",
              color: primaryTeamMeta.color,
              border: `1px solid ${primaryTeamMeta.color}44`,
            }}
          >
            {primaryTeamMeta.label}
          </span>
        </div>
      )}

      {/* XP */}
      <span
        className="shrink-0 text-sm font-heading tabular-nums"
        style={{ color: primaryTeamMeta?.color ?? "#A855F7" }}
      >
        {volunteer.xp.toLocaleString()} XP
      </span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-10">
      {/* Your rank */}
      <SkeletonBlock className="h-20 rounded-2xl" />

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-10 rounded-xl" />
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Podium */}
      <div className="flex items-end gap-4 justify-center">
        <div className="flex-1 rounded-xl bg-[#1a1a2e] animate-pulse" style={{ height: 160 }} />
        <div className="flex-1 rounded-xl bg-[#1a1a2e] animate-pulse" style={{ height: 200 }} />
        <div className="flex-1 rounded-xl bg-[#1a1a2e] animate-pulse" style={{ height: 140 }} />
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonBlock key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Chapter Dropdown ─────────────────────────────────────────────────────────

function ChapterDropdown({
  currentUser,
  viewingChapterId,
  onChange,
}: {
  currentUser: CurrentUser | null;
  viewingChapterId: string;
  onChange: (chapter: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-heading border transition-colors ${
          open
            ? "bg-accent-primary/20 border-accent-primary text-accent-highlight"
            : "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary bg-surface"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="hidden sm:inline truncate max-w-[120px]">
          {viewingChapterId ? shortChapter(viewingChapterId) : "Chapter"}
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl border border-border bg-elevated shadow-2xl py-2 min-w-[220px] animate-modal-in">
          {CHAPTERS.map((ch) => (
            <button
              key={ch}
              onClick={() => { onChange(ch); setOpen(false); }}
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
}

// ─── Inner Page (uses useSearchParams) ───────────────────────────────────────

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [viewingChapterId, setViewingChapterId] = useState("");

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [teamFilter, setTeamFilter] = useState("all");
  const [seasonTab, setSeasonTab] = useState<"season" | "all-time">("season");

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data()?.onboardingComplete !== true) {
        router.replace("/onboarding");
        return;
      }
      const data = snap.data() as CurrentUser;
      const fromParam = searchParams.get("chapter");
      setCurrentUser({ ...data, uid: user.uid });
      setViewingChapterId(fromParam ?? data.chapterId);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router, searchParams]);

  // ── Fetch volunteers ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewingChapterId) return;
    let cancelled = false;

    async function fetchData() {
      setLoadingData(true);
      setTeamFilter("all");
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("chapterId", "==", viewingChapterId))
        );
        if (!cancelled) {
          setVolunteers(snap.docs.map((d) => ({ ...d.data(), uid: d.id } as Volunteer)));
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard data:", err);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [viewingChapterId]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const base = teamFilter === "all"
      ? volunteers
      : volunteers.filter((v) => v.teams.includes(teamFilter));
    return [...base].sort((a, b) => b.xp - a.xp);
  }, [volunteers, teamFilter]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const myRank = currentUser
    ? filtered.findIndex((v) => v.uid === currentUser.uid) + 1
    : 0;
  const me = currentUser ? filtered.find((v) => v.uid === currentUser.uid) : undefined;
  const xpToNext = me && myRank > 1
    ? (filtered[myRank - 2]?.xp ?? 0) - me.xp
    : 0;

  const avatarUrl = currentUser
    ? buildAvatarUrl(currentUser.username, currentUser.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  const CHIP_BASE = "px-3 py-1 rounded-full text-xs font-heading font-medium border transition-all active:scale-95 flex items-center gap-1.5";
  const CHIP_IDLE = "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary";

  const chapterDropdownAction = authChecked ? (
    <ChapterDropdown
      currentUser={currentUser}
      viewingChapterId={viewingChapterId}
      onChange={(ch) => setViewingChapterId(ch)}
    />
  ) : undefined;

  const region = CHAPTER_REGIONS[viewingChapterId] ?? "Philippines";

  return (
    <PageShell
      title="Leaderboard"
      avatarUrl={avatarUrl}
      loading={!authChecked || loadingData}
      skeleton={<LeaderboardSkeleton />}
      backHref="/chapter"
      actions={chapterDropdownAction}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-10">

          {/* Chapter context */}
          <div className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "0ms" }}>
            <div className="flex items-center gap-1.5 text-text-muted text-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="font-heading text-sm text-text-secondary">{viewingChapterId}</span>
            </div>
            <span className="text-text-muted text-sm">·</span>
            <span className="text-text-muted text-xs">{region}</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30 text-yellow-400/60 font-sans uppercase tracking-wide shrink-0">
              Season 1
            </span>
          </div>

          {/* Your rank */}
          {me && myRank > 0 && (
            <YourRankCard
              volunteer={me}
              rank={myRank}
              total={filtered.length}
              xpToNext={xpToNext}
            />
          )}

          {/* Season tabs + team filter */}
          <div className="flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "40ms" }}>
            {/* Season tabs */}
            <div className="flex rounded-xl bg-surface border border-border p-1 gap-1 w-fit">
              {(["season", "all-time"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSeasonTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-heading font-medium transition-colors capitalize ${
                    seasonTab === tab
                      ? "bg-accent-highlight text-white"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab === "season" ? "Season 1" : "All-Time"}
                </button>
              ))}
            </div>

            {/* Team filter chips */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTeamFilter("all")}
                className={`${CHIP_BASE} ${teamFilter === "all" ? "border-accent-highlight bg-accent-highlight/10 text-accent-highlight" : CHIP_IDLE}`}
              >
                All Teams
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

            {/* Filter context */}
            {teamFilter !== "all" && (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: TEAM_META[teamFilter]?.color }}
                />
                <span className="text-xs text-text-muted">
                  Showing{" "}
                  <span
                    className="font-medium"
                    style={{ color: TEAM_META[teamFilter]?.color }}
                  >
                    {TEAM_META[teamFilter]?.label}
                  </span>{" "}
                  volunteers only · {filtered.length} member
                  {filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-border/30 flex items-center justify-center animate-float">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-heading text-lg text-text-primary">No volunteers found</p>
                <p className="text-sm text-text-secondary">
                  {teamFilter !== "all"
                    ? `No ${TEAM_META[teamFilter]?.label} members in this chapter yet.`
                    : "No volunteers in this chapter yet."}
                </p>
              </div>
              {teamFilter !== "all" && (
                <button
                  onClick={() => setTeamFilter("all")}
                  className="text-sm text-accent-highlight hover:text-accent-primary transition-colors"
                >
                  View all teams
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ── Podium ────────────────────────────────────────────────────── */}
              <div
                className="rounded-2xl bg-surface border border-border p-6 animate-fade-up"
                style={{ animationDelay: "80ms" }}
              >
                {/* Subtle background shimmer */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-[0.03] pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 0%, #F5C518, transparent 70%)",
                  }}
                />

                <div className="relative flex items-end gap-3 sm:gap-6">
                  {/* Order: 2nd, 1st, 3rd */}
                  <PodiumSlot
                    volunteer={top3[1]}
                    rank={2}
                    isCurrentUser={top3[1]?.uid === currentUser?.uid}
                  />
                  <PodiumSlot
                    volunteer={top3[0]}
                    rank={1}
                    isCurrentUser={top3[0]?.uid === currentUser?.uid}
                  />
                  <PodiumSlot
                    volunteer={top3[2]}
                    rank={3}
                    isCurrentUser={top3[2]?.uid === currentUser?.uid}
                  />
                </div>
              </div>

              {/* ── Ranks 4+ ──────────────────────────────────────────────────── */}
              {rest.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 mb-2 animate-fade-up" style={{ animationDelay: "160ms" }}>
                    <span className="font-heading text-[10px] text-text-muted uppercase tracking-widest">
                      Full Rankings
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-[10px] text-text-muted tabular-nums">
                      {filtered.length} volunteer{filtered.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {rest.map((v, i) => (
                    <RankRow
                      key={`${teamFilter}-${v.uid}`}
                      volunteer={v}
                      rank={i + 4}
                      isCurrentUser={v.uid === currentUser?.uid}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ─── Page export with Suspense ────────────────────────────────────────────────

export default function LeaderboardPage() {
  return (
    <Suspense>
      <LeaderboardContent />
    </Suspense>
  );
}
