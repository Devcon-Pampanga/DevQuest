"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";
import { TIER_ORDER, TIER_LABELS, TEAM_META } from "@/lib/seed/quests";
import { Quest, QuestCompletion } from "@/types/quest";
import { getXpLevelProgress, XP_LEVEL_STEP } from "@/lib/xpLevel";

// ─── Avatar (editor) ─────────────────────────────────────────────────────────

interface AvatarOptions {
  backgroundColor: string;
  backgroundType: "solid" | "gradientLinear";
  eyes: string;
  mouth: string;
}

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserData {
  username: string;
  email: string;
  role: "volunteer" | "coordinator";
  contactNumber: string;
  chapterId: string;
  teams: string[];
  xp: number;
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
}

interface RegistrationDoc {
  attended: boolean;
  reflectionSubmitted: boolean;
  reflectionDeadline?: Timestamp;
}

type UIQuestStatus = "locked" | "available" | "in_progress" | "pending_approval" | "completed";

interface PendingReflection {
  eventId: string;
  eventName: string;
  hoursLeft: number;
}

interface LeaderboardEntry {
  uid: string;
  username: string;
  xp: number;
  avatarOptions?: AvatarOptions;
}

// ─── Quest / tier helpers (aligned with quests page) ───────────────────────────

function isTierUnlocked(
  teamId: string,
  tier: Quest["tier"],
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): boolean {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === 0) return true;
  const prevTier = TIER_ORDER[idx - 1];
  const prevQuests = allQuests.filter((q) => q.teamId === teamId && q.tier === prevTier);
  return prevQuests.every((q) => completions[q.questId]?.status === "completed");
}

function getCurrentTier(
  teamId: string,
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): Quest["tier"] {
  for (const tier of TIER_ORDER) {
    if (!isTierUnlocked(teamId, tier, completions, allQuests)) continue;
    const tierQuests = allQuests.filter((q) => q.teamId === teamId && q.tier === tier);
    const allDone = tierQuests.every((q) => completions[q.questId]?.status === "completed");
    if (!allDone) return tier;
  }
  return TIER_ORDER[TIER_ORDER.length - 1];
}

function getQuestUIStatus(
  quest: Quest,
  completions: Record<string, QuestCompletion>,
  tierUnlocked: boolean
): UIQuestStatus {
  if (!tierUnlocked) return "locked";
  const c = completions[quest.questId];
  if (!c) return "available";
  return c.status as UIQuestStatus;
}

function pickPrimaryTeam(teamIds: string[], completions: Record<string, QuestCompletion>, allQuests: Quest[]): string {
  if (teamIds.length === 0) return "";
  let best = teamIds[0];
  let bestCount = -1;
  for (const tid of teamIds) {
    const count = allQuests.filter(
      (q) => q.teamId === tid && completions[q.questId]?.status === "completed"
    ).length;
    if (count > bestCount) {
      bestCount = count;
      best = tid;
    }
  }
  return best;
}

function hoursUntil(ts: Timestamp): number {
  return Math.max(0, Math.floor((ts.toDate().getTime() - Date.now()) / 3600000));
}

function formatEventDate(ts: Timestamp): string {
  return ts.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function totalSlots(roles: EventDoc["roles"]): number {
  return roles.reduce((sum, r) => sum + r.slots, 0);
}

/** Same layout as chapter page Recent Events carousel (`EventCarouselItem`). */
function UpcomingEventCarouselCard({
  event,
  regCount,
  index,
}: {
  event: EventDoc;
  regCount: number;
  index: number;
}) {
  const total = totalSlots(event.roles);
  const pct = total > 0 ? Math.min(100, (regCount / total) * 100) : 0;

  return (
    <Link
      href={`/events/${event.eventId}`}
      className="rounded-xl bg-elevated border border-border overflow-hidden flex flex-col hover:border-accent-primary/50 transition-[border-color,box-shadow] hover:shadow-[0_4px_16px_rgba(124,58,237,0.15)] cursor-pointer group shrink-0 animate-fade-up"
      style={{ width: 210, animationDelay: `${240 + index * 50}ms` }}
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
          <img src="/event-banner-placeholder.png" alt="" className="w-full h-full object-cover" />
        )}
        <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide bg-accent-primary/80 text-white">
          Upcoming
        </span>
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1 min-h-0">
        <div className="font-heading text-sm text-text-primary leading-snug line-clamp-2">{event.name}</div>
        <div className="flex items-center gap-1 text-[11px] text-text-muted">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="p-6">
      <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-6 items-start pb-10">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          {/* Identity Card */}
          <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] overflow-hidden animate-pulse">
            <div className="p-5 relative flex flex-col gap-4">
              <div className="hidden sm:flex absolute top-5 right-5 gap-2 z-10">
                <SkeletonBlock className="h-9 w-16 rounded-xl" />
                <SkeletonBlock className="h-9 w-16 rounded-xl" />
              </div>
              <div className="h-fit w-full flex flex-row items-center gap-4 min-w-0 sm:pr-[11rem]">
                <SkeletonBlock className="size-[4.5rem] sm:size-20 rounded-xl shrink-0" />
                <div className="min-w-0 flex flex-col justify-center gap-1 flex-1">
                  <SkeletonLine className="w-full max-w-[14rem]" />
                  <SkeletonLine className="w-28" />
                  <SkeletonLine className="w-36" />
                </div>
              </div>
              <div className="border-t border-[#27272A] pt-4 flex flex-col gap-2">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <SkeletonLine className="w-12" />
                    <SkeletonLine className="w-8" />
                  </div>
                  <div className="space-y-1 text-right">
                    <SkeletonLine className="w-16 ml-auto" />
                    <SkeletonLine className="w-24 ml-auto" />
                  </div>
                </div>
                <SkeletonBlock className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          </div>
          {/* Quest cards */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <SkeletonLine className="w-28" />
              <SkeletonLine className="w-12" />
            </div>
            <div className="grid grid-cols-1 gap-3 animate-pulse">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <SkeletonLine className="w-32" />
                    <SkeletonBlock className="h-5 w-14 rounded-lg shrink-0" />
                  </div>
                  <SkeletonLine className="w-full" />
                  <SkeletonLine className="w-3/4" />
                  <div className="border-t border-[#27272A] pt-2 mt-1">
                    <SkeletonLine className="w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Events */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <SkeletonLine className="w-36" />
              <SkeletonLine className="w-12" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 animate-pulse scrollbar-minimal">
              <div className="shrink-0 rounded-xl border border-[#27272A] overflow-hidden w-[210px]">
                <SkeletonBlock className="h-28 w-full rounded-none" />
                <div className="p-3 flex flex-col gap-2">
                  <SkeletonLine className="w-full" />
                  <SkeletonLine className="w-2/3" />
                  <SkeletonBlock className="h-1 w-full rounded-full mt-2" />
                  <SkeletonLine className="w-24" />
                </div>
              </div>
              <div className="shrink-0 rounded-xl border border-[#27272A] overflow-hidden w-[210px]">
                <SkeletonBlock className="h-28 w-full rounded-none" />
                <div className="p-3 flex flex-col gap-2">
                  <SkeletonLine className="w-full" />
                  <SkeletonLine className="w-2/3" />
                  <SkeletonBlock className="h-1 w-full rounded-full mt-2" />
                  <SkeletonLine className="w-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right sidebar */}
        <div className="flex flex-col gap-3 w-full animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 flex flex-col gap-2.5">
              <SkeletonLine className="w-24" />
              <SkeletonBlock className="h-1.5 w-full rounded-full" />
              <SkeletonLine className="w-16" />
            </div>
          ))}
          <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 flex flex-col gap-2">
            <SkeletonLine className="w-28" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <SkeletonBlock className="w-5 h-5 rounded-md shrink-0" />
                <SkeletonBlock className="w-7 h-7 rounded-lg shrink-0" />
                <SkeletonLine className="flex-1" />
                <SkeletonLine className="w-10 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [firebaseUid, setFirebaseUid] = useState("");

  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<Record<string, QuestCompletion>>({});
  const [eventsAttendedCount, setEventsAttendedCount] = useState(0);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [pendingReflection, setPendingReflection] = useState<PendingReflection | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [approvalsCount, setApprovalsCount] = useState(0);
  const [chapterVolunteersActive, setChapterVolunteersActive] = useState<number | null>(null);
  const [eventsThisMonthCount, setEventsThisMonthCount] = useState(0);

  const [upcomingRegCounts, setUpcomingRegCounts] = useState<Record<string, number>>({});

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userLeaderboardRank, setUserLeaderboardRank] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);

  const [barsReady, setBarsReady] = useState(false);

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
      setFirebaseUser(user);
      setFirebaseUid(user.uid);
      setUserData(snap.data() as UserData);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!firebaseUid || !userData) return;
    const chapterId = userData.chapterId;

    async function load() {
      setDashboardLoading(true);
      try {
        const xpCol = collection(db, "users", firebaseUid, "xpLog");
        const [questsSnap, completionsSnap, eventCountSnap, eventsSnap] = await Promise.all([
          getDocs(collection(db, "quests")),
          getDocs(collection(db, "users", firebaseUid, "questCompletions")),
          getCountFromServer(query(xpCol, where("source", "==", "event_attendance"))),
          getDocs(collection(db, "events")),
        ]);

        setAllQuests(questsSnap.docs.map((d) => d.data() as Quest));
        const map: Record<string, QuestCompletion> = {};
        completionsSnap.docs.forEach((d) => {
          map[d.id] = d.data() as QuestCompletion;
        });
        setCompletions(map);
        setEventsAttendedCount(eventCountSnap.data().count);

        const eventDocs = eventsSnap.docs
          .map((d) => ({ eventId: d.id, ...d.data() }) as EventDoc)
          .sort((a, b) => a.date.toMillis() - b.date.toMillis());
        setEvents(eventDocs);

        const chapterEvents = eventDocs.filter((e) => e.chapterId === chapterId);
        const now = new Date();
        let best: PendingReflection | null = null;
        let bestDeadlineMs = Infinity;

        await Promise.all(
          chapterEvents.map(async (ev) => {
            const regSnap = await getDoc(doc(db, "events", ev.eventId, "registrations", firebaseUid));
            if (!regSnap.exists()) return;
            const reg = regSnap.data() as RegistrationDoc;
            const deadline = reg.reflectionDeadline;
            if (
              !reg.attended ||
              reg.reflectionSubmitted ||
              !deadline ||
              deadline.toDate() <= now
            ) {
              return;
            }
            const ms = deadline.toMillis();
            if (ms < bestDeadlineMs) {
              bestDeadlineMs = ms;
              best = {
                eventId: ev.eventId,
                eventName: ev.name,
                hoursLeft: hoursUntil(deadline),
              };
            }
          })
        );
        setPendingReflection(best);

        const y = now.getFullYear();
        const m = now.getMonth();
        const thisMonth = chapterEvents.filter((e) => {
          const d = e.date.toDate();
          return d.getFullYear() === y && d.getMonth() === m;
        }).length;
        setEventsThisMonthCount(thisMonth);

        const upcoming = chapterEvents
          .filter((e) => e.date.toDate() > now)
          .slice(0, 5);
        const countEntries = await Promise.all(
          upcoming.map(async (ev) => {
            const snap = await getCountFromServer(collection(db, "events", ev.eventId, "registrations"));
            return [ev.eventId, snap.data().count] as [string, number];
          })
        );
        setUpcomingRegCounts(Object.fromEntries(countEntries));

        // Leaderboard: top volunteers in chapter by XP
        const leaderSnap = await getDocs(
          query(
            collection(db, "users"),
            where("chapterId", "==", chapterId),
            where("onboardingComplete", "==", true)
          )
        );
        const sorted = leaderSnap.docs
          .map((d) => ({
            uid: d.id,
            username: d.data().username as string,
            xp: (d.data().xp as number) ?? 0,
            avatarOptions: d.data().avatarOptions as AvatarOptions | undefined,
          }))
          .sort((a, b) => b.xp - a.xp);
        setLeaderboard(sorted.slice(0, 5));
        const selfRank = sorted.findIndex((v) => v.uid === firebaseUid);
        setUserLeaderboardRank(selfRank >= 0 ? selfRank + 1 : null);
      } finally {
        setDashboardLoading(false);
      }
    }

    void load();
  }, [firebaseUid, userData]);

  const loadApprovalsCount = useCallback(async () => {
    if (!userData || userData.role !== "coordinator") return;
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("chapterId", "==", userData.chapterId))
      );
      let n = 0;
      await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
          const completionsSnap = await getDocs(
            query(
              collection(db, "users", userDoc.id, "questCompletions"),
              where("status", "==", "pending_approval")
            )
          );
          n += completionsSnap.size;
        })
      );
      setApprovalsCount(n);
    } catch {
      setApprovalsCount(0);
    }
  }, [userData]);

  useEffect(() => {
    void loadApprovalsCount();
  }, [loadApprovalsCount]);

  const loadChapterVolunteers = useCallback(async () => {
    if (!userData || userData.role !== "coordinator") return;
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("chapterId", "==", userData.chapterId))
      );
      const active = usersSnap.docs.filter((d) => d.data()?.onboardingComplete === true).length;
      setChapterVolunteersActive(active);
    } catch {
      setChapterVolunteersActive(null);
    }
  }, [userData]);

  useEffect(() => {
    void loadChapterVolunteers();
  }, [loadChapterVolunteers]);

  // Delay bar fill animations until after section entrances settle
  useEffect(() => {
    if (dashboardLoading) {
      setBarsReady(false);
      return;
    }
    const t = setTimeout(() => setBarsReady(true), 350);
    return () => clearTimeout(t);
  }, [dashboardLoading]);

  const primaryTeamId = useMemo(
    () => pickPrimaryTeam(userData?.teams ?? [], completions, allQuests),
    [userData?.teams, completions, allQuests]
  );

  const primaryMeta = primaryTeamId ? TEAM_META[primaryTeamId] : undefined;

  const currentTier = useMemo(() => {
    if (!primaryTeamId) return null;
    return getCurrentTier(primaryTeamId, completions, allQuests);
  }, [primaryTeamId, completions, allQuests]);

  const activeQuestCards = useMemo(() => {
    if (!primaryTeamId || currentTier === null) return [];
    const tierUnlocked = isTierUnlocked(primaryTeamId, currentTier, completions, allQuests);
    const tierQuests = allQuests.filter((q) => q.teamId === primaryTeamId && q.tier === currentTier);
    const withStatus = tierQuests.map((q) => ({
      quest: q,
      status: getQuestUIStatus(q, completions, tierUnlocked),
    }));
    const interesting = withStatus.filter((x) => x.status === "in_progress" || x.status === "available");
    interesting.sort((a, b) => {
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (a.status !== "in_progress" && b.status === "in_progress") return 1;
      return 0;
    });
    return interesting.slice(0, 3).map((x) => x.quest);
  }, [primaryTeamId, currentTier, allQuests, completions]);

  const upcomingChapterEvents = useMemo(() => {
    if (!userData) return [];
    const now = new Date();
    return events
      .filter((e) => e.chapterId === userData.chapterId && e.date.toDate() > now)
      .sort((a, b) => a.date.toMillis() - b.date.toMillis())
      .slice(0, 5);
  }, [events, userData]);

  const completedQuestCount = useMemo(
    () => Object.values(completions).filter((c) => c.status === "completed").length,
    [completions]
  );

  const xpProgress = useMemo(() => getXpLevelProgress(userData?.xp ?? 0), [userData?.xp]);

  const teamProgressMap = useMemo(() => {
    if (!userData || allQuests.length === 0) return {} as Record<string, {
      currentTier: Quest["tier"];
      completed: number;
      total: number;
      pct: number;
      nextLabel: string | null;
      isMaxTier: boolean;
    }>;
    return Object.fromEntries(
      userData.teams.map((teamId) => {
        const tier = getCurrentTier(teamId, completions, allQuests);
        const tierQuests = allQuests.filter((q) => q.teamId === teamId && q.tier === tier);
        const completed = tierQuests.filter((q) => completions[q.questId]?.status === "completed").length;
        const total = tierQuests.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 100;
        const tierIdx = TIER_ORDER.indexOf(tier);
        const nextTierKey = tierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[tierIdx + 1] : null;
        const isMaxTier = tier === "lead" && completed === total && total > 0;
        const nextLabel = nextTierKey && !isMaxTier ? TIER_LABELS[nextTierKey] : null;
        return [teamId, { currentTier: tier, completed, total, pct, nextLabel, isMaxTier }];
      })
    );
  }, [userData, allQuests, completions]);

  function displayName(raw: string) {
    return raw.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  function handleCopyShare() {
    if (!userData || typeof window === "undefined") return;
    const url = `${window.location.origin}/profile/${encodeURIComponent(userData.username)}`;
    void navigator.clipboard.writeText(url);
    setCopiedShare(true);
    window.setTimeout(() => setCopiedShare(false), 2000);
  }

  if (!authChecked || !userData) {
    return (
      <PageShell title="Dashboard" loading skeleton={<DashboardSkeleton />}>
        {null}
      </PageShell>
    );
  }

  const activeAvatar = userData.avatarOptions ?? DEFAULT_AVATAR;
  const avatarUrl = buildAvatarUrl(userData.username, activeAvatar);
  const teamColor = primaryMeta?.color ?? "#A855F7";

  return (
    <>
      <PageShell
        title="Dashboard"
        avatarUrl={avatarUrl}
        loading={dashboardLoading}
        skeleton={<DashboardSkeleton />}
      >
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ background: `radial-gradient(ellipse 90% 420px at -5% -5%, ${teamColor}0f 0%, transparent 55%)` }}
        >
          <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-6 items-stretch lg:items-start pb-10">
            {error ? <p className="lg:col-span-3 text-red-400 text-sm">{error}</p> : null}

            {/* ── LEFT COLUMN (col-span-2) ── */}
            <div className="contents lg:flex lg:flex-col gap-6 lg:col-span-2">

              {/* Identity Card — order-1 mobile */}
              <div
                className="order-1 lg:order-none relative rounded-2xl overflow-hidden animate-fade-up"
                style={{
                  background: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 45%, #A855F7 80%, #C084FC 100%)",
                  animationDelay: "0ms",
                }}
              >
                {/* Dot pattern — same as ChapterHero */}
                <div
                  className="absolute inset-0 opacity-[0.07] pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />
                {/* Glow orb */}
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

                <div className="p-5 relative z-10 flex flex-col gap-4">
                  <div className="hidden sm:flex absolute top-5 right-5 z-20 gap-2">
                    <Link
                      href="/profile#badges"
                      className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-heading uppercase tracking-wider transition-colors backdrop-blur-sm border border-white/20"
                    >
                      Badges
                    </Link>
                    <button
                      type="button"
                      onClick={handleCopyShare}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-heading uppercase tracking-wider transition-colors backdrop-blur-sm border border-white/20"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span key={copiedShare ? "copied" : "share"} style={copiedShare ? { animation: "pop 250ms cubic-bezier(0.16, 1, 0.3, 1) both", display: "inline-block" } : undefined}>
                        {copiedShare ? "Copied" : "Share"}
                      </span>
                    </button>
                  </div>
                  {/* Fixed avatar size; text column vertically centered to match the row. */}
                  <div className="h-fit w-full flex flex-row items-center gap-4 min-w-0 sm:pr-[11rem]">
                    <div
                      className="relative shrink-0 size-[4.5rem] sm:size-20 rounded-xl overflow-hidden border-2"
                      style={{ backgroundColor: "#100c1a", borderColor: teamColor }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl}
                        alt="Profile avatar"
                        width={80}
                        height={80}
                        className="block h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex flex-col justify-center gap-1 flex-1 leading-none">
                      <h1 className="font-heading text-xl sm:text-2xl text-white leading-tight truncate min-h-0">
                        {displayName(userData!.username)}
                      </h1>
                      <span className="inline-flex w-fit text-[10px] font-sans uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white shrink-0 leading-normal mt-0.5">
                        {userData!.role === "coordinator" ? "Coordinator" : "Volunteer"}
                      </span>
                      <p className="text-sm text-white/70 font-sans truncate leading-snug mt-0.5">
                        {userData!.chapterId}
                      </p>
                    </div>
                  </div>
                  <div className="w-full pt-4 border-t border-white/15">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] text-white/60 font-sans uppercase tracking-widest">Level</p>
                        <p className="font-heading text-2xl tabular-nums leading-none text-white mt-0.5">
                          {xpProgress.level}
                        </p>
                      </div>
                      <div className="text-right min-w-0">
                        <p className="text-[10px] text-white/60 font-sans uppercase tracking-widest">Progress</p>
                        <p className="font-heading text-lg sm:text-2xl tabular-nums leading-none text-white mt-0.5 whitespace-nowrap">
                          {xpProgress.xpIntoLevel.toLocaleString()} / {XP_LEVEL_STEP.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${xpProgress.pctToNextLevel}%`,
                          backgroundColor: teamColor,
                        }}
                      />
                    </div>
                  </div>
                  {/* Mobile actions */}
                  <div className="flex sm:hidden gap-2">
                    <Link
                      href="/profile#badges"
                      className="flex-1 inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-heading uppercase tracking-wider transition-colors backdrop-blur-sm border border-white/20"
                    >
                      Badges
                    </Link>
                    <button
                      type="button"
                      onClick={handleCopyShare}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-heading uppercase tracking-wider transition-colors backdrop-blur-sm border border-white/20"
                    >
                      {copiedShare ? "Copied" : "Share"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reflection Nudge — order-2 mobile */}
              {pendingReflection ? (
                <div
                  className="order-2 lg:order-none rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-up"
                  style={{ animationDelay: "60ms" }}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xl shrink-0" aria-hidden>⏳</span>
                    <div className="min-w-0">
                      <p className="text-sm font-heading text-amber-100/95">
                        {pendingReflection.eventName} — reflection due in {pendingReflection.hoursLeft}h
                      </p>
                      <p className="text-xs text-text-muted font-sans mt-0.5">Submit before the deadline to earn +25 XP.</p>
                    </div>
                  </div>
                  <Link
                    href={`/events/${pendingReflection.eventId}/reflect`}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-heading transition-colors"
                  >
                    Submit Now
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              ) : null}

              {/* Stat Cards — order-3 mobile */}
              <div className="order-3 lg:order-none grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
                <div className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${teamColor}18` }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={teamColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Quests Complete</p>
                    <p className="font-heading text-2xl tabular-nums leading-none mt-0.5" style={{ color: teamColor }}>{completedQuestCount}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${teamColor}18` }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={teamColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Events Attended</p>
                    <p className="font-heading text-2xl tabular-nums leading-none mt-0.5" style={{ color: teamColor }}>{eventsAttendedCount}</p>
                  </div>
                </div>
              </div>

              {/* Active Quests — order-6 mobile */}
              <section
                className="order-6 lg:order-none animate-fade-up"
                style={{ animationDelay: "120ms" }}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="font-heading text-xl text-text-primary">Active quests</h2>
                  <Link href="/quests" className="text-xs font-heading text-accent-highlight hover:text-text-primary transition-colors" aria-label="View all quests">
                    View all
                  </Link>
                </div>
                {activeQuestCards.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-surface px-5 py-8 flex flex-col items-center gap-3 text-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted" aria-hidden style={{ animation: "float 3s ease-in-out infinite" }}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <div>
                      <p className="font-heading text-sm text-text-primary mb-1">No active quests yet</p>
                      <p className="text-xs text-text-muted font-sans max-w-[22ch] mx-auto">Complete your team&#39;s associate-tier quests to advance your career path.</p>
                    </div>
                    <Link
                      href="/quests"
                      className="inline-flex items-center justify-center border border-border rounded-xl px-4 py-2 text-xs font-heading text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors"
                    >
                      Browse Quests
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {activeQuestCards.map((q, i) => (
                      <Link
                        key={q.questId}
                        href="/quests"
                        className="rounded-2xl border border-border bg-surface p-4 hover:border-accent-primary/50 hover:scale-[1.01] transition-[transform,border-color] flex flex-col gap-2.5 animate-fade-up"
                        style={{ animationDelay: `${180 + i * 50}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-heading text-base text-text-primary leading-snug">{q.name}</p>
                          <span
                            className="shrink-0 text-xs font-heading tabular-nums px-2 py-0.5 rounded-lg whitespace-nowrap"
                            style={{ color: teamColor, backgroundColor: `${teamColor}18` }}
                          >
                            +{q.xpReward} XP
                          </span>
                        </div>
                        <p className="text-xs text-text-muted font-sans line-clamp-2 flex-1">{q.description}</p>
                        <div className="flex items-center gap-2 pt-2.5 border-t border-border mt-auto">
                          <span className="text-[10px] font-sans uppercase tracking-widest" style={{ color: teamColor }}>
                            {primaryMeta?.label}
                          </span>
                          <span className="text-text-muted text-xs select-none">·</span>
                          <span className="text-[10px] text-text-muted font-sans">{q.completionMethod.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* Upcoming Events — order-7 mobile */}
              <section
                className="order-7 lg:order-none animate-fade-up"
                style={{ animationDelay: "180ms" }}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="font-heading text-xl text-text-primary">Upcoming events</h2>
                  <Link href="/events" className="text-xs font-heading text-accent-highlight hover:text-text-primary transition-colors" aria-label="View all events">
                    View all
                  </Link>
                </div>
                {upcomingChapterEvents.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-surface px-5 py-8 flex flex-col items-center gap-3 text-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted" aria-hidden style={{ animation: "float 3s ease-in-out 300ms infinite" }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <div>
                      <p className="font-heading text-sm text-text-primary mb-1">No upcoming events</p>
                      <p className="text-xs text-text-muted font-sans max-w-[26ch] mx-auto">Your chapter coordinator will post events here when they&#39;re scheduled.</p>
                    </div>
                    <Link
                      href="/events"
                      className="inline-flex items-center justify-center border border-border rounded-xl px-4 py-2 text-xs font-heading text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors"
                    >
                      View All Events
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-minimal -mx-1 px-1">
                    {upcomingChapterEvents.map((ev, i) => (
                      <UpcomingEventCarouselCard
                        key={ev.eventId}
                        event={ev}
                        regCount={upcomingRegCounts[ev.eventId] ?? 0}
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </section>

            </div>{/* end left column */}

            {/* ── RIGHT SIDEBAR (col-span-1) ── */}
            <div className="contents lg:flex lg:flex-col gap-4 lg:col-start-3 lg:col-span-1">

              {/* Coordinator Section — order-3 mobile */}
              {userData!.role === "coordinator" ? (
                <div
                  className="order-4 lg:order-none rounded-2xl bg-surface border border-border p-5 flex flex-col gap-3 animate-fade-up"
                  style={{ animationDelay: "0ms" }}
                >
                  <h2 className="font-heading text-sm text-text-primary uppercase tracking-widest">Coordinator</h2>
                  <Link
                    href="/quests?tab=approvals"
                    className="rounded-2xl border p-4 hover:border-accent-primary/60 transition-colors"
                    style={{
                      borderColor: approvalsCount > 0 ? "#A855F755" : "#27272A",
                      backgroundColor: approvalsCount > 0 ? "#A855F708" : "#16213e",
                    }}
                  >
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Pending approvals</p>
                    <p
                      className="font-heading text-2xl text-accent-highlight tabular-nums"
                      style={approvalsCount > 0 ? { animation: "count-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) 700ms 3" } : undefined}
                    >{approvalsCount}</p>
                    <p className="text-xs text-text-muted font-sans mt-1.5">Awaiting review</p>
                  </Link>
                  <Link
                    href="/events/new"
                    className="rounded-2xl p-4 flex flex-col justify-between transition-colors hover:bg-accent-highlight/20"
                    style={{ backgroundColor: "#A855F714", border: "1px solid #A855F730" }}
                  >
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Quick action</p>
                    <p className="font-heading text-lg text-text-primary">Add Event</p>
                    <p className="text-xs font-sans mt-1.5" style={{ color: "#A855F7" }}>Create new →</p>
                  </Link>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border bg-elevated p-3">
                      <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-1.5">Active</p>
                      <p className="font-heading text-xl text-text-primary tabular-nums">
                        {chapterVolunteersActive === null ? "—" : chapterVolunteersActive}
                      </p>
                      <p className="text-[10px] text-text-muted font-sans mt-0.5">volunteers</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-elevated p-3">
                      <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-1.5">This month</p>
                      <p className="font-heading text-xl text-text-primary tabular-nums">{eventsThisMonthCount}</p>
                      <p className="text-[10px] text-text-muted font-sans mt-0.5">events</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Team Progress Cards — order-4 mobile */}
              {userData!.teams.length > 0 ? (
                <div className="order-5 lg:order-none flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
                  {userData!.teams.map((teamId) => {
                    const meta = TEAM_META[teamId];
                    const prog = teamProgressMap[teamId];
                    if (!meta || !prog) return null;
                    return (
                      <div key={teamId} className="rounded-2xl bg-surface border border-border p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                            <span className="font-heading text-sm text-text-primary">{meta.label}</span>
                          </div>
                          <span
                            className="text-[10px] font-heading px-2 py-0.5 rounded-full border uppercase tracking-wide shrink-0"
                            style={{ color: meta.color, borderColor: `${meta.color}40`, backgroundColor: `${meta.color}10` }}
                          >
                            {TIER_LABELS[prog.currentTier]}
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-text-muted font-sans">Quest Progress</span>
                            <span className="font-heading tabular-nums" style={{ color: meta.color }}>
                              {prog.completed}/{prog.total}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${barsReady ? prog.pct : 0}%`, backgroundColor: meta.color }}
                            />
                          </div>
                        </div>
                        {!prog.isMaxTier && prog.nextLabel ? (
                          <p className="text-[11px] text-text-muted font-sans">
                            Next: <span style={{ color: meta.color }}>{prog.nextLabel}</span>
                          </p>
                        ) : null}
                        {prog.isMaxTier ? (
                          <p className="text-[11px] font-sans font-medium" style={{ color: meta.color }}>Max tier reached</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Season Leaderboard — order-8 mobile */}
              <div className="order-8 lg:order-none rounded-2xl bg-surface border border-border p-5 flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "180ms" }}>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm text-text-primary uppercase tracking-widest">Leaderboard</span>
                  <Link href="/chapter" className="text-xs text-accent-highlight hover:text-accent-primary transition-colors">
                    View all →
                  </Link>
                </div>
                {leaderboard.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4 font-sans">No data yet</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {leaderboard.map((entry, i) => {
                      const isCurrentUser = entry.uid === firebaseUid;
                      const entryColor = isCurrentUser ? teamColor : "#A1A1AA";
                      return (
                        <div
                          key={entry.uid}
                          className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors"
                          style={isCurrentUser ? { backgroundColor: `${teamColor}10`, border: `1px solid ${teamColor}25` } : {}}
                        >
                          <span
                            className="font-heading text-sm tabular-nums shrink-0 w-5 text-center"
                            style={{ color: i === 0 ? "#F5C518" : i === 1 ? "#A1A1AA" : i === 2 ? "#CD7F32" : "#52525B" }}
                          >
                            {i + 1}
                          </span>
                          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-border" style={{ backgroundColor: "#100c1a" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={buildAvatarUrl(entry.username, entry.avatarOptions ?? DEFAULT_AVATAR)}
                              alt=""
                              width={28}
                              height={28}
                              className="w-full h-full"
                            />
                          </div>
                          <span className="flex-1 text-xs font-sans text-text-primary truncate">
                            {entry.username}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-[9px] font-sans uppercase tracking-wide" style={{ color: teamColor }}> you</span>
                            )}
                          </span>
                          <span className="text-xs font-heading tabular-nums shrink-0" style={{ color: entryColor }}>
                            {(entry.xp ?? 0).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    {userLeaderboardRank !== null && userLeaderboardRank > 5 && (
                      <>
                        <div className="flex items-center gap-2 px-2 py-1">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[10px] text-text-muted font-sans">your rank</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div
                          className="flex items-center gap-3 px-2 py-2 rounded-xl"
                          style={{ backgroundColor: `${teamColor}10`, border: `1px solid ${teamColor}25` }}
                        >
                          <span className="font-heading text-sm tabular-nums shrink-0 w-5 text-center text-text-muted">
                            {userLeaderboardRank}
                          </span>
                          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-border" style={{ backgroundColor: "#100c1a" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={avatarUrl} alt="" width={28} height={28} className="w-full h-full" />
                          </div>
                          <span className="flex-1 text-xs font-sans text-text-primary truncate">
                            {userData!.username}
                            <span className="ml-1.5 text-[9px] font-sans uppercase tracking-wide" style={{ color: teamColor }}> you</span>
                          </span>
                          <span className="text-xs font-heading tabular-nums shrink-0" style={{ color: teamColor }}>
                            {(userData!.xp ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>{/* end right sidebar */}

          </div>
        </div>
      </PageShell>
    </>
  );
}
