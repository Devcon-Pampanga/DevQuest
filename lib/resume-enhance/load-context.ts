import { TEAM_META, TIER_LABELS } from "@/lib/seed/quests";
import type { Quest, QuestCompletion } from "@/types/quest";
import type { Firestore } from "firebase-admin/firestore";
import { getEarnedTier } from "./earned-tier";

const MAX_REFLECTIONS = 8;
const MAX_TEXT_FIELD = 500;
const MAX_XP_SNIPPETS = 12;

function truncate(s: unknown, max: number): string {
  if (typeof s !== "string" || !s.trim()) return "";
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

/** Serializable bundle sent to Gemini (no secrets). */
export interface ResumeEnhancePromptContext {
  displayName: string;
  chapterId: string;
  totalXp: number;
  role: "volunteer" | "coordinator";
  teamSummaries: { label: string; earnedTier: string }[];
  completedQuests: { name: string; coordinatorVerified: boolean }[];
  reflections: {
    eventName: string;
    role: string;
    whatDidYouDo: string;
    wentWell: string;
    doDifferently: string;
  }[];
  recentXpDescriptions: string[];
  stats: {
    eventsAttendedEstimate: number;
    reflectionsCount: number;
    questsCompleted: number;
  };
}

export async function loadResumeEnhanceContext(
  db: Firestore,
  uid: string
): Promise<ResumeEnhancePromptContext | null> {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return null;

  const user = userSnap.data()!;
  const username = typeof user.username === "string" ? user.username : "Volunteer";
  const chapterId = typeof user.chapterId === "string" ? user.chapterId : "";
  const totalXp = typeof user.xp === "number" ? user.xp : 0;
  const role = user.role === "coordinator" ? "coordinator" : "volunteer";
  const teamIds = Array.isArray(user.teams) ? (user.teams as string[]).filter((t) => typeof t === "string") : [];

  const [questsSnap, completionsSnap, reflectionsSnap, reflectionsCountSnap, xpAttendanceSnap, xpLogSnap] =
    await Promise.all([
      db.collection("quests").get(),
      userRef.collection("questCompletions").get(),
      userRef.collection("reflections").orderBy("submittedAt", "desc").limit(MAX_REFLECTIONS).get(),
      userRef.collection("reflections").count().get(),
      userRef.collection("xpLog").where("source", "==", "event_attendance").count().get(),
      userRef.collection("xpLog").orderBy("createdAt", "desc").limit(MAX_XP_SNIPPETS).get(),
    ]);

  const allQuests = questsSnap.docs.map((d) => d.data() as Quest);
  const completions: Record<string, QuestCompletion> = {};
  completionsSnap.forEach((d) => {
    completions[d.id] = d.data() as QuestCompletion;
  });

  const teamSummaries = teamIds
    .filter((tid) => TEAM_META[tid])
    .map((tid) => {
      const meta = TEAM_META[tid];
      const earned = getEarnedTier(tid, completions, allQuests);
      const earnedTier = earned === "lead" ? meta.leadTitle : (TIER_LABELS[earned] ?? earned);
      return { label: meta.label, earnedTier };
    });

  const completedQuests = allQuests
    .filter((q) => completions[q.questId]?.status === "completed")
    .map((q) => ({
      name: q.name,
      coordinatorVerified: Boolean(completions[q.questId]?.approvedBy),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const reflections = reflectionsSnap.docs.map((d) => {
    const r = d.data();
    return {
      eventName: truncate(r.eventName, 120),
      role: truncate(r.role, 80),
      whatDidYouDo: truncate(r.whatDidYouDo, MAX_TEXT_FIELD),
      wentWell: truncate(r.wentWell, MAX_TEXT_FIELD),
      doDifferently: truncate(r.doDifferently, MAX_TEXT_FIELD),
    };
  });

  const recentXpDescriptions: string[] = [];
  xpLogSnap.forEach((d) => {
    const desc = truncate(d.data().description, 220);
    if (desc) recentXpDescriptions.push(desc);
  });

  const eventsAttendedEstimate = xpAttendanceSnap.data().count;
  const reflectionsCount = reflectionsCountSnap.data().count;

  return {
    displayName: username.replace(/\s+/g, " ").trim() || "Volunteer",
    chapterId,
    totalXp,
    role,
    teamSummaries,
    completedQuests,
    reflections,
    recentXpDescriptions,
    stats: {
      eventsAttendedEstimate,
      reflectionsCount,
      questsCompleted: completedQuests.length,
    },
  };
}
