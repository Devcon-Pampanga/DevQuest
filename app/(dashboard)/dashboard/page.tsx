"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  onAuthStateChanged,
  signOut,
  deleteUser,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useSidebar } from "@/context/SidebarContext";
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

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { openSidebar } = useSidebar();

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

  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"logout" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [draftOptions, setDraftOptions] = useState<AvatarOptions>(DEFAULT_AVATAR);
  const [savingAvatar, setSavingAvatar] = useState(false);

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
          .slice(0, 2);
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
      .slice(0, 2);
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

  async function handleLogout() {
    setError("");
    setLoading(true);
    setLoadingAction("logout");
    try {
      await signOut(auth);
      router.replace("/");
    } catch {
      setError("Failed to sign out. Please try again.");
      setLoading(false);
      setLoadingAction(null);
    }
  }

  async function handleDeleteAccount() {
    if (!firebaseUser) return;
    setError("");
    setLoading(true);
    setLoadingAction("delete");
    try {
      await deleteDoc(doc(db, "users", firebaseUser.uid));
      await deleteUser(firebaseUser);
      router.replace("/");
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "";
      setError(
        msg.includes("requires-recent-login")
          ? "For security, please sign out and sign in again before deleting your account."
          : "Failed to delete account. Please try again."
      );
      setLoading(false);
      setLoadingAction(null);
      setConfirmDelete(false);
    }
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

  if (!authChecked || !userData) return null;

  const activeAvatar = userData.avatarOptions ?? DEFAULT_AVATAR;
  const avatarUrl = buildAvatarUrl(userData.username, activeAvatar);
  const teamColor = primaryMeta?.color ?? "#A855F7";

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border shrink-0 bg-base">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={openSidebar}
              className="lg:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors shrink-0"
              aria-label="Open sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Image src="/icon.png" alt="" width={28} height={28} className="shrink-0 rounded-lg" aria-hidden />
            <div className="min-w-0">
              <p className="font-heading text-lg text-text-primary tracking-wide leading-tight truncate">DevQuest</p>
              <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/notifications"
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <BellIcon />
            </Link>
            <Link href="/profile" className="shrink-0">
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-10">
            {error ? <p className="text-red-400 text-sm text-center">{error}</p> : null}

            {dashboardLoading ? (
              <p className="text-text-secondary text-sm font-sans text-center py-12">Loading your dashboard…</p>
            ) : (
              <>
                {/* Hero */}
                <div
                  className="rounded-2xl border border-border overflow-hidden relative"
                  style={{
                    background: `linear-gradient(135deg, ${teamColor}22 0%, #1a1a2e 45%, #0f0f18 100%)`,
                  }}
                >
                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-6">
                    <div className="relative shrink-0 mx-auto sm:mx-0">
                      <button
                        type="button"
                        onClick={openAvatarEditor}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-border block focus:outline-none focus:ring-2 focus:ring-accent-highlight"
                        style={{ backgroundColor: "#100c1a" }}
                        aria-label="Edit avatar"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarUrl} alt="" width={112} height={112} className="w-full h-full object-cover" />
                      </button>
                      <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border border-border pointer-events-none"
                        style={{ backgroundColor: "#1a1625", color: "#A1A1AA" }}
                      >
                        <PencilIcon />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="font-heading text-xl sm:text-2xl text-text-primary truncate">
                          {displayName(userData.username)}
                        </h1>
                        {userData.role === "coordinator" ? (
                          <span
                            className="text-[10px] font-sans uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0"
                            style={{ borderColor: "#A855F755", backgroundColor: "#A855F714", color: "#A855F7" }}
                          >
                            Coordinator
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-text-secondary font-sans">
                        <span className="text-text-primary font-medium">{userData.chapterId}</span>
                      </p>
                      {primaryMeta && currentTier ? (
                        <p className="text-sm font-sans" style={{ color: teamColor }}>
                          {primaryMeta.label} — {currentTierLabel}
                        </p>
                      ) : (
                        <p className="text-sm text-text-muted font-sans">Select teams in your profile to track quest progress.</p>
                      )}

                      {tierProgress && primaryMeta ? (
                        tierProgress.done && tierProgress.total > 0 ? (
                          <div>
                            <p className="text-xs font-sans text-text-secondary mb-2">
                              All quests complete for {primaryMeta.label}. Outstanding work.
                            </p>
                            <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: "100%", backgroundColor: teamColor }} />
                            </div>
                          </div>
                        ) : tierProgress.total > 0 ? (
                          <div>
                            <p className="text-xs font-sans text-text-secondary mb-2">
                              {tierProgress.completed} of {tierProgress.total} quests
                              {tierProgress.nextLabel
                                ? ` to ${tierProgress.nextLabel}`
                                : primaryMeta
                                  ? ` toward ${primaryMeta.leadTitle}`
                                  : ""}
                            </p>
                            <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${tierProgress.pct}%`, backgroundColor: teamColor }}
                              />
                            </div>
                          </div>
                        ) : null
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/profile#badges"
                          className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50 text-xs font-heading uppercase tracking-wider transition-colors"
                        >
                          View Badges
                        </Link>
                        <button
                          type="button"
                          onClick={handleCopyShare}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50 text-xs font-heading uppercase tracking-wider transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                          {copiedShare ? "Copied" : "Share"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* XP band */}
                  <div className="px-5 sm:px-6 py-4 border-t border-border/80 bg-black/20">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
                      <div>
                        <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-1">Level {xpProgress.level}</p>
                        <p className="font-sans font-bold text-3xl tabular-nums text-text-primary">
                          {(userData.xp ?? 0).toLocaleString()}
                          <span className="text-sm font-sans font-normal text-text-muted ml-1.5">XP</span>
                        </p>
                      </div>
                      <p className="text-xs text-text-secondary font-sans text-right max-w-[14rem]">
                        {xpProgress.xpToNextLevel > 0 ? (
                          <>
                            {xpProgress.xpToNextLevel.toLocaleString()} XP to Level {xpProgress.level + 1}
                          </>
                        ) : (
                          <>Max band progress</>
                        )}
                      </p>
                    </div>
                    <div className="h-2 rounded-full bg-black/35 overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full bg-accent-highlight"
                        style={{ width: `${xpProgress.pctToNextLevel}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted font-sans">
                      {Math.round(xpProgress.pctToNextLevel)}% toward your next level — keep earning XP through events, quests, and reflections.
                    </p>
                  </div>
                </div>

                {pendingReflection ? (
                  <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl shrink-0" aria-hidden>
                        ⏳
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-heading text-amber-100/95">
                          {pendingReflection.eventName} — Reflection due in {pendingReflection.hoursLeft} hour
                          {pendingReflection.hoursLeft !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-text-muted font-sans mt-1">Submit before the deadline to earn reflection XP.</p>
                      </div>
                    </div>
                    <Link
                      href={`/events/${pendingReflection.eventId}/reflect`}
                      className="shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white text-sm font-heading font-semibold transition-colors"
                    >
                      Submit Now →
                    </Link>
                  </div>
                ) : null}

                {userData.role === "coordinator" ? (
                  <div className="rounded-2xl bg-surface border border-border p-5 flex flex-col gap-4">
                    <h2 className="text-[11px] font-sans uppercase tracking-widest text-text-muted">Coordinator</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link
                        href="/quests?tab=approvals"
                        className="rounded-xl border border-border p-4 hover:border-accent-primary/40 transition-colors"
                      >
                        <p className="text-xs text-text-muted font-sans uppercase tracking-wide mb-1">Pending approvals</p>
                        <p className="font-heading text-2xl text-accent-highlight tabular-nums">{approvalsCount}</p>
                      </Link>
                      <Link
                        href="/events/new"
                        className="rounded-xl border border-border p-4 hover:border-accent-primary/40 transition-colors flex flex-col justify-center"
                      >
                        <p className="text-xs text-text-muted font-sans uppercase tracking-wide mb-1">Quick action</p>
                        <p className="font-heading text-lg text-text-primary">Add Event</p>
                      </Link>
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs text-text-muted font-sans uppercase tracking-wide mb-1">Active volunteers</p>
                        <p className="font-heading text-2xl text-text-primary tabular-nums">
                          {chapterVolunteersActive === null ? "—" : chapterVolunteersActive}
                        </p>
                        <p className="text-[10px] text-text-muted font-sans mt-1">Onboarding complete · your chapter</p>
                      </div>
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs text-text-muted font-sans uppercase tracking-wide mb-1">Events this month</p>
                        <p className="font-heading text-2xl text-text-primary tabular-nums">{eventsThisMonthCount}</p>
                        <p className="text-[10px] text-text-muted font-sans mt-1">Scheduled in {userData.chapterId}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-surface border border-border p-4">
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Achievements</p>
                    <p className="font-heading text-2xl text-accent-highlight tabular-nums">{completedQuestCount}</p>
                    <p className="text-[10px] text-text-muted font-sans mt-1">Quests completed</p>
                  </div>
                  <div className="rounded-2xl bg-surface border border-border p-4">
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">Events</p>
                    <p className="font-heading text-2xl text-[#22C55E] tabular-nums">{eventsAttendedCount}</p>
                    <p className="text-[10px] text-text-muted font-sans mt-1">Events attended</p>
                  </div>
                </div>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[11px] font-sans uppercase tracking-widest text-text-muted">Active quests</h2>
                    <Link href="/quests" className="text-xs font-heading text-accent-highlight hover:underline">
                      View All
                    </Link>
                  </div>
                  {activeQuestCards.length === 0 ? (
                    <p className="text-sm text-text-muted font-sans rounded-2xl border border-border bg-surface px-4 py-6 text-center">
                      No active quests right now. Head to Quests to see what is available.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {activeQuestCards.map((q) => (
                        <Link
                          key={q.questId}
                          href="/quests"
                          className="rounded-2xl border bg-surface p-4 hover:border-accent-primary/50 transition-colors"
                          style={{ borderColor: `${teamColor}44` }}
                        >
                          <p className="font-heading text-sm text-text-primary leading-snug">{q.name}</p>
                          <p className="text-[11px] text-text-muted font-sans mt-2 line-clamp-2">{q.description}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[11px] font-sans uppercase tracking-widest text-text-muted">Upcoming events</h2>
                    <Link href="/events" className="text-xs font-heading text-accent-highlight hover:underline">
                      View All
                    </Link>
                  </div>
                  {upcomingChapterEvents.length === 0 ? (
                    <p className="text-sm text-text-muted font-sans rounded-2xl border border-border bg-surface px-4 py-6 text-center">
                      No upcoming events in your chapter. Check back soon.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {upcomingChapterEvents.map((ev) => {
                        const total = totalSlots(ev.roles);
                        const reg = upcomingRegCounts[ev.eventId] ?? 0;
                        const pct = total > 0 ? Math.min(100, (reg / total) * 100) : 0;
                        return (
                          <Link
                            key={ev.eventId}
                            href={`/events/${ev.eventId}`}
                            className="rounded-2xl border border-border bg-surface p-4 hover:border-accent-primary/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-heading text-sm text-text-primary">{ev.name}</p>
                              <span className="text-[10px] font-sans uppercase tracking-wide text-green-400 shrink-0">Upcoming</span>
                            </div>
                            <p className="text-xs text-text-secondary font-sans mt-2">{formatEventDate(ev.date)}</p>
                            {total > 0 ? (
                              <div className="mt-3">
                                <div className="flex justify-between text-[10px] text-text-muted font-sans mb-1">
                                  <span>Slots</span>
                                  <span className="tabular-nums">
                                    {reg}/{total}
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-black/30 overflow-hidden">
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
              </>
            )}

            {/* Account footer */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setAccountOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-[11px] font-sans uppercase tracking-widest text-text-muted">Account</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-text-muted transition-transform ${accountOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {accountOpen ? (
                <div className="px-4 pb-4 pt-0 flex flex-col gap-3 border-t border-border">
                  <p className="text-xs text-text-secondary font-sans pt-3">{userData.email}</p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full bg-accent-highlight hover:bg-accent-primary text-white font-heading text-sm tracking-widest uppercase py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingAction === "logout" ? "Signing out…" : "Log Out"}
                  </button>
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDelete(true);
                        setError("");
                      }}
                      disabled={loading}
                      className="w-full bg-transparent border border-border hover:border-red-500/40 text-text-muted hover:text-red-400 font-sans text-sm py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="rounded-xl border border-red-500/25 overflow-hidden" style={{ backgroundColor: "#1a0d0d" }}>
                      <div className="px-4 pt-4 pb-3">
                        <p className="text-text-secondary text-xs text-center leading-relaxed mb-4">
                          This will permanently delete your account and all associated data.
                          <span className="block text-red-400/80 mt-1">This cannot be undone.</span>
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            disabled={loading}
                            className="flex-1 border border-border text-text-muted hover:text-text-primary font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={loading}
                            className="flex-1 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
                            style={{ backgroundColor: "#ff000010" }}
                          >
                            {loadingAction === "delete" ? "Deleting…" : "Yes, Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showAvatarEditor && userData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !savingAvatar && setShowAvatarEditor(false)} role="presentation" />
          <div
            className="relative border border-border rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl"
            style={{ backgroundColor: "#1a1625" }}
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
