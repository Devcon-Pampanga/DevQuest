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
  updateDoc,
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
import { getXpLevelProgress } from "@/lib/xpLevel";

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

const BG_COLORS: { hex: string; label: string }[] = [
  { hex: "transparent", label: "None" },
  { hex: "ffb300", label: "Amber" },
  { hex: "fdd835", label: "Yellow" },
  { hex: "43a047", label: "Green" },
  { hex: "00acc1", label: "Teal" },
  { hex: "039be5", label: "Blue" },
  { hex: "1e88e5", label: "Indigo" },
  { hex: "5e35b1", label: "Purple" },
  { hex: "8e24aa", label: "Violet" },
  { hex: "d81b60", label: "Pink" },
  { hex: "e53935", label: "Red" },
  { hex: "f4511e", label: "Orange" },
  { hex: "00897b", label: "Mint" },
];

const EYES_OPTIONS: { id: string; label: string }[] = [
  { id: "bulging", label: "Bulging" },
  { id: "dizzy", label: "Dizzy" },
  { id: "eva", label: "Eva" },
  { id: "frame1", label: "Frame 1" },
  { id: "frame2", label: "Frame 2" },
  { id: "glow", label: "Glow" },
  { id: "happy", label: "Happy" },
  { id: "hearts", label: "Hearts" },
  { id: "robocop", label: "Robocop" },
  { id: "round", label: "Round" },
  { id: "roundFrame01", label: "Round Frame 1" },
  { id: "roundFrame02", label: "Round Frame 2" },
  { id: "sensor", label: "Sensor" },
  { id: "shade01", label: "Shade" },
];

const MOUTH_OPTIONS: { id: string; label: string }[] = [
  { id: "bite", label: "Bite" },
  { id: "diagram", label: "Diagram" },
  { id: "grill01", label: "Grill 1" },
  { id: "grill02", label: "Grill 2" },
  { id: "grill03", label: "Grill 3" },
  { id: "smile01", label: "Smile 1" },
  { id: "smile02", label: "Smile 2" },
  { id: "square01", label: "Square 1" },
  { id: "square02", label: "Square 2" },
];

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

function PencilIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
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

function tierDisplayLabel(teamId: string, tier: Quest["tier"]): string {
  const meta = TEAM_META[teamId];
  if (tier === "lead" && meta?.leadTitle) return meta.leadTitle;
  return TIER_LABELS[tier] ?? tier;
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 pb-16">
      {/* Identity Card */}
      <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] mt-6 mb-4 overflow-hidden animate-pulse">
        <div className="p-5 flex items-start gap-4">
          <SkeletonBlock className="w-[76px] h-[76px] rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-2.5 pt-0.5">
            <SkeletonLine className="w-48" />
            <SkeletonLine className="w-28" />
            <SkeletonLine className="w-36" />
          </div>
          <div className="flex gap-2 shrink-0">
            <SkeletonBlock className="h-7 w-16 rounded-lg" />
            <SkeletonBlock className="h-7 w-16 rounded-lg" />
          </div>
        </div>
        <div className="border-t border-[#27272A] px-5 py-3.5 flex flex-col gap-2">
          <div className="flex justify-between">
            <SkeletonLine className="w-40" />
            <SkeletonLine className="w-8" />
          </div>
          <SkeletonBlock className="h-1 w-full rounded-full" />
        </div>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 flex flex-col gap-2">
            <SkeletonLine className="w-16" />
            <SkeletonBlock className="h-8 w-12 rounded-lg" />
            <SkeletonLine className="w-20" />
          </div>
        ))}
      </div>
      {/* Quest cards */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <SkeletonLine className="w-28" />
          <SkeletonLine className="w-12" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {[0, 1, 2].map((i) => (
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
        <div className="flex gap-3 animate-pulse">
          <SkeletonBlock className="h-28 w-[240px] rounded-2xl shrink-0" />
          <SkeletonBlock className="h-28 w-[240px] rounded-2xl shrink-0" />
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

  const [error, setError] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);

  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [draftOptions, setDraftOptions] = useState<AvatarOptions>(DEFAULT_AVATAR);
  const [savingAvatar, setSavingAvatar] = useState(false);
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

  const tierProgress = useMemo(() => {
    if (!primaryTeamId || currentTier === null) return null;
    const tierQuests = allQuests.filter((q) => q.teamId === primaryTeamId && q.tier === currentTier);
    if (tierQuests.length === 0) return { done: true as const, pct: 100, completed: 0, total: 0, nextLabel: "" };
    const completed = tierQuests.filter((q) => completions[q.questId]?.status === "completed").length;
    const total = tierQuests.length;
    const allLeadDone =
      currentTier === "lead" &&
      tierQuests.every((q) => completions[q.questId]?.status === "completed");
    if (allLeadDone) {
      return { done: true as const, pct: 100, completed, total, nextLabel: "" };
    }
    const nextIdx = TIER_ORDER.indexOf(currentTier) + 1;
    const nextTier = nextIdx < TIER_ORDER.length ? TIER_ORDER[nextIdx] : null;
    const nextLabel = nextTier && primaryTeamId ? tierDisplayLabel(primaryTeamId, nextTier) : "";
    return {
      done: false as const,
      pct: Math.round((completed / total) * 100),
      completed,
      total,
      nextLabel,
    };
  }, [primaryTeamId, currentTier, allQuests, completions]);

  const currentTierLabel =
    primaryTeamId && currentTier ? tierDisplayLabel(primaryTeamId, currentTier) : "";

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

  function displayName(raw: string) {
    return raw.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  function openAvatarEditor() {
    if (!userData) return;
    setDraftOptions(userData.avatarOptions ?? DEFAULT_AVATAR);
    setShowAvatarEditor(true);
  }

  function handleCopyShare() {
    if (!userData || typeof window === "undefined") return;
    const url = `${window.location.origin}/profile/${encodeURIComponent(userData.username)}`;
    void navigator.clipboard.writeText(url);
    setCopiedShare(true);
    window.setTimeout(() => setCopiedShare(false), 2000);
  }

  async function handleSaveAvatar() {
    if (!firebaseUser) return;
    setSavingAvatar(true);
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        avatarOptions: draftOptions,
      });
      setUserData((prev) => (prev ? { ...prev, avatarOptions: draftOptions } : prev));
      setShowAvatarEditor(false);
    } catch {
      setError("Failed to save avatar. Please try again.");
    } finally {
      setSavingAvatar(false);
    }
  }

  function OptionChip({
    label,
    selected,
    onClick,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="px-3 py-1.5 rounded-lg text-xs font-sans border transition-all"
        style={
          selected
            ? { borderColor: "#A855F7", backgroundColor: "#A855F714", color: "#A855F7", borderWidth: "2px" }
            : { borderColor: "#27272A", backgroundColor: "transparent", color: "#A1A1AA", borderWidth: "1px" }
        }
      >
        {label}
      </button>
    );
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
          className="flex-1 overflow-y-auto"
          style={{ background: `radial-gradient(ellipse 90% 420px at -5% -5%, ${teamColor}0f 0%, transparent 55%)` }}
        >
          <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 pb-16">
            {error ? <p className="text-red-400 text-sm pt-4 mb-2">{error}</p> : null}

            {/* ── Identity Card ─────────────────────────────────────────────────── */}
            <div
              className="rounded-2xl border bg-surface mt-6 mb-4 overflow-hidden animate-fade-up"
              style={{
                borderColor: `${teamColor}40`,
                animationDelay: "0ms",
              }}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative group shrink-0">
                    <button
                      type="button"
                      onClick={openAvatarEditor}
                      className="w-[76px] h-[76px] rounded-xl overflow-hidden border-2 block focus:outline-none focus:ring-2 focus:ring-accent-highlight relative"
                      style={{ backgroundColor: "#100c1a", borderColor: teamColor }}
                      aria-label="Edit avatar"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl} alt="" width={76} height={76} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PencilIcon />
                      </div>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="font-heading text-3xl sm:text-4xl text-text-primary leading-none">
                        {displayName(userData!.username)}
                      </h1>
                      {userData!.role === "coordinator" ? (
                        <span
                          className="text-[10px] font-sans uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0"
                          style={{ borderColor: "#A855F755", backgroundColor: "#A855F714", color: "#A855F7" }}
                        >
                          Coordinator
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-text-muted font-sans mb-2.5">{userData!.chapterId}</p>
                    {primaryMeta && currentTier ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-sans px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: `${teamColor}18`, color: teamColor }}
                        >
                          {primaryMeta.label}
                        </span>
                        <span className="text-text-muted text-xs select-none">·</span>
                        <span className="text-xs text-text-secondary font-sans">{currentTierLabel}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted font-sans">No teams selected.</p>
                    )}
                  </div>
                  <div className="hidden sm:flex gap-2 shrink-0">
                    <Link
                      href="/profile#badges"
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50 text-xs font-heading uppercase tracking-wider transition-colors"
                    >
                      Badges
                    </Link>
                    <button
                      type="button"
                      onClick={handleCopyShare}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50 text-xs font-heading uppercase tracking-wider transition-colors"
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
                </div>
                {/* Mobile actions */}
                <div className="flex sm:hidden gap-2 mt-4">
                  <Link
                    href="/profile#badges"
                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-white/5 text-xs font-heading uppercase tracking-wider transition-colors"
                  >
                    Badges
                  </Link>
                  <button
                    type="button"
                    onClick={handleCopyShare}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-white/5 text-xs font-heading uppercase tracking-wider transition-colors"
                  >
                    {copiedShare ? "Copied" : "Share"}
                  </button>
                </div>
              </div>
              {/* Tier progress footer */}
              {tierProgress && primaryMeta && tierProgress.total > 0 ? (
                <div
                  className="border-t px-5 py-3.5"
                  style={{ borderColor: `${teamColor}25`, backgroundColor: `${teamColor}08` }}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="text-xs font-sans text-text-muted">
                      {tierProgress.done ? (
                        <>All quests complete — <span style={{ color: teamColor }}>{primaryMeta.label}</span></>
                      ) : (
                        <>{tierProgress.completed} / {tierProgress.total} quests to <span style={{ color: teamColor }}>{tierProgress.nextLabel || primaryMeta.leadTitle}</span></>
                      )}
                    </p>
                    <span className="text-xs font-sans tabular-nums shrink-0" style={{ color: tierProgress.done ? teamColor : "#52525B" }}>
                      {tierProgress.pct}%
                    </span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)", height: "4px" }}>
                    <div
                      style={{
                        height: "4px",
                        width: "100%",
                        borderRadius: "9999px",
                        transformOrigin: "left center",
                        transform: `scaleX(${barsReady ? tierProgress.pct / 100 : 0})`,
                        transition: barsReady ? "transform 700ms cubic-bezier(0.16, 1, 0.3, 1) 150ms" : "none",
                        backgroundColor: teamColor,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── Stats Grid ────────────────────────────────────────────────────── */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 animate-fade-up"
              style={{ animationDelay: "60ms" }}
            >
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Level</p>
                <p className="font-heading text-5xl tabular-nums text-text-primary leading-none mb-1">{xpProgress.level}</p>
                <p className="text-[11px] text-text-muted font-sans">
                  {xpProgress.xpToNextLevel > 0 ? `${xpProgress.xpToNextLevel.toLocaleString()} XP to next` : "Max level"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Total XP</p>
                <p className="font-heading text-4xl tabular-nums text-text-primary leading-none mb-2">
                  {(userData!.xp ?? 0).toLocaleString()}
                </p>
                <div className="w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)", height: "3px" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: teamColor,
                      width: "100%",
                      transformOrigin: "left center",
                      transform: `scaleX(${barsReady ? xpProgress.pctToNextLevel / 100 : 0})`,
                      transition: barsReady ? "transform 900ms cubic-bezier(0.16, 1, 0.3, 1) 100ms" : "none",
                    }}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Quests Done</p>
                <p className="font-heading text-4xl tabular-nums leading-none mb-1" style={{ color: teamColor }}>{completedQuestCount}</p>
                <p className="text-[11px] text-text-muted font-sans">milestones earned</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Events</p>
                <p className="font-heading text-4xl tabular-nums leading-none mb-1" style={{ color: teamColor }}>{eventsAttendedCount}</p>
                <p className="text-[11px] text-text-muted font-sans">attended</p>
              </div>
            </div>

            {/* ── Reflection nudge ─────────────────────────────────────────────── */}
            {pendingReflection ? (
              <div
                className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 animate-fade-up"
                style={{ animationDelay: "120ms" }}
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

            {/* ── Coordinator ──────────────────────────────────────────────────── */}
            {userData!.role === "coordinator" ? (
              <div
                className="mb-4 animate-fade-up"
                style={{ animationDelay: "120ms" }}
              >
                <h2 className="font-heading text-sm text-text-primary mb-3">Coordinator</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Link
                    href="/quests?tab=approvals"
                    className="rounded-2xl border bg-surface p-4 hover:border-accent-primary/60 transition-colors"
                    style={{
                      borderColor: approvalsCount > 0 ? "#A855F755" : "#27272A",
                      backgroundColor: approvalsCount > 0 ? "#A855F708" : "#1a1a2e",
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
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Active volunteers</p>
                    <p className="font-heading text-2xl text-text-primary tabular-nums">
                      {chapterVolunteersActive === null ? "—" : chapterVolunteersActive}
                    </p>
                    <p className="text-xs text-text-muted font-sans mt-0.5">in your chapter</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">This month</p>
                    <p className="font-heading text-2xl text-text-primary tabular-nums">{eventsThisMonthCount}</p>
                    <p className="text-xs text-text-muted font-sans mt-0.5">events in {userData!.chapterId}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── Active Quests — cards ─────────────────────────────────────────── */}
            <section
              className="mb-4 animate-fade-up"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

            {/* ── Upcoming Events ──────────────────────────────────────────────── */}
            <section
              className="animate-fade-up"
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
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-minimal -mx-4 px-4 sm:-mx-6 sm:px-6">
                  {upcomingChapterEvents.map((ev, i) => {
                    const total = totalSlots(ev.roles);
                    const reg = upcomingRegCounts[ev.eventId] ?? 0;
                    const pct = total > 0 ? Math.min(100, (reg / total) * 100) : 0;
                    return (
                      <Link
                        key={ev.eventId}
                        href={`/events/${ev.eventId}`}
                        className="rounded-2xl border border-border bg-surface p-5 hover:border-accent-primary/50 hover:scale-[1.02] transition snap-start shrink-0 w-[240px] flex flex-col gap-3 animate-fade-up"
                        style={{ animationDelay: `${240 + i * 50}ms` }}
                      >
                        <div>
                          <p className="text-[11px] font-sans uppercase tracking-widest mb-1.5" style={{ color: teamColor }}>
                            {formatEventDate(ev.date)}
                          </p>
                          <p className="font-heading text-sm text-text-primary leading-snug line-clamp-2">{ev.name}</p>
                        </div>
                        {total > 0 ? (
                          <div>
                            <div className="flex justify-between text-xs font-sans mb-1.5 text-text-muted">
                              <span>Slots</span>
                              <span className="tabular-nums text-text-secondary">{reg}/{total}</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                              <div className="h-full rounded-full bg-accent-highlight" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        </div>
      </PageShell>


      {showAvatarEditor && userData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !savingAvatar && setShowAvatarEditor(false)} role="presentation" style={{ animation: "fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both" }} />
          <div
            className="relative border border-border rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl"
            style={{ backgroundColor: "#1a1625", animation: "modal-in 350ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-heading text-[1rem] text-white">Customize Avatar</h2>
              <button
                type="button"
                onClick={() => !savingAvatar && setShowAvatarEditor(false)}
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="overflow-y-auto scrollbar-minimal px-5 py-5 space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-border" style={{ backgroundColor: "#100c1a" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={buildAvatarUrl(userData.username, draftOptions)} alt="" width={96} height={96} className="w-full h-full" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-3">Background Color</p>
                <div className="flex flex-wrap gap-2.5">
                  {BG_COLORS.map(({ hex, label }) => {
                    const isSelected = draftOptions.backgroundColor === hex;
                    return (
                      <button
                        key={hex}
                        type="button"
                        title={label}
                        onClick={() => setDraftOptions((p) => ({ ...p, backgroundColor: hex }))}
                        className="w-7 h-7 rounded-full transition-all focus:outline-none"
                        style={
                          hex === "transparent"
                            ? {
                                background: "repeating-conic-gradient(#3f3f46 0% 25%, #2a2a3e 0% 50%) 0 0 / 8px 8px",
                                outline: isSelected ? "2px solid #A855F7" : "2px solid transparent",
                                outlineOffset: "2px",
                              }
                            : {
                                backgroundColor: `#${hex}`,
                                outline: isSelected ? "2px solid #A855F7" : "2px solid transparent",
                                outlineOffset: "2px",
                              }
                        }
                      />
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-3">Background Style</p>
                <div className="flex gap-2">
                  {(
                    [
                      { id: "solid" as const, label: "Solid" },
                      { id: "gradientLinear" as const, label: "Gradient" },
                    ] as const
                  ).map(({ id, label }) => (
                    <OptionChip
                      key={id}
                      label={label}
                      selected={draftOptions.backgroundType === id}
                      onClick={() => setDraftOptions((p) => ({ ...p, backgroundType: id }))}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-3">Eyes</p>
                <div className="flex flex-wrap gap-2">
                  {EYES_OPTIONS.map(({ id, label }) => (
                    <OptionChip
                      key={id}
                      label={label}
                      selected={draftOptions.eyes === id}
                      onClick={() => setDraftOptions((p) => ({ ...p, eyes: id }))}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-3">Mouth</p>
                <div className="flex flex-wrap gap-2">
                  {MOUTH_OPTIONS.map(({ id, label }) => (
                    <OptionChip
                      key={id}
                      label={label}
                      selected={draftOptions.mouth === id}
                      onClick={() => setDraftOptions((p) => ({ ...p, mouth: id }))}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-border flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAvatarEditor(false)}
                disabled={savingAvatar}
                className="flex-1 border border-border text-text-muted hover:text-text-primary font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={savingAvatar}
                className="flex-1 bg-accent-highlight hover:bg-accent-primary text-white font-heading text-xs tracking-widest uppercase py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingAvatar ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
