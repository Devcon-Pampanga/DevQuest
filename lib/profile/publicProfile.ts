import "server-only";

import type { AvatarOptions } from "@/lib/avatar";
import { getFirebaseAdminOrThrow } from "@/lib/firebase-admin";
import type { ChapterVolunteer } from "@/types/chapter";
import type { Quest, QuestCompletion } from "@/types/quest";
import type { XPLogEntry } from "@/types/xp";

export interface PublicProfileUser {
  uid: string;
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  teams: string[];
  xp: number;
  starsReceived?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  createdAtMs?: number;
  avatarOptions?: AvatarOptions;
}

export interface SerializedQuestCompletion extends Omit<QuestCompletion, "completedAt"> {
  completedAtMs?: number;
}

export interface SerializedXpLogEntry extends Omit<XPLogEntry, "createdAt"> {
  createdAtMs?: number;
}

export interface PublicProfilePayload {
  user: PublicProfileUser;
  quests: Quest[];
  completions: Record<string, SerializedQuestCompletion>;
  leaderboard: ChapterVolunteer[];
  activityEntries: SerializedXpLogEntry[];
  hasMoreActivity: boolean;
  reflectionCount: number;
  eventCount: number;
  profileSetupCount: number;
}

function toMillis(value: unknown): number | undefined {
  if (!value || typeof value !== "object") return undefined;
  if ("toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  return undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function getPublicProfilePayload(uid: string): Promise<PublicProfilePayload | null> {
  const { db } = getFirebaseAdminOrThrow();
  const userSnap = await db.collection("users").doc(uid).get();

  if (!userSnap.exists) {
    return null;
  }

  const rawUser = userSnap.data() as Record<string, unknown>;
  const role = rawUser.role === "coordinator" ? "coordinator" : "volunteer";
  const chapterId = typeof rawUser.chapterId === "string" ? rawUser.chapterId : "";

  const [
    questsSnap,
    completionsSnap,
    leaderboardSnap,
    xpLogSnap,
    reflectionsSnap,
    eventXpSnap,
    profileSetupSnap,
  ] = await Promise.all([
    db.collection("quests").get(),
    db.collection("users").doc(uid).collection("questCompletions").get(),
    chapterId
      ? db.collection("users").where("chapterId", "==", chapterId).where("role", "==", "volunteer").get()
      : Promise.resolve(null),
    db.collection("users").doc(uid).collection("xpLog").orderBy("createdAt", "desc").limit(21).get(),
    db.collection("users").doc(uid).collection("reflections").get(),
    db.collection("users").doc(uid).collection("xpLog").where("source", "==", "event_attendance").get(),
    db.collection("users").doc(uid).collection("xpLog").where("source", "==", "profile_setup").get(),
  ]);

  const completions: Record<string, SerializedQuestCompletion> = {};
  completionsSnap.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    completions[doc.id] = {
      questId: typeof data.questId === "string" ? data.questId : doc.id,
      status: data.status as QuestCompletion["status"],
      submissionNotes: typeof data.submissionNotes === "string" ? data.submissionNotes : undefined,
      evidenceUrl: typeof data.evidenceUrl === "string" ? data.evidenceUrl : undefined,
      approvedBy: typeof data.approvedBy === "string" ? data.approvedBy : undefined,
      xpGranted: typeof data.xpGranted === "number" ? data.xpGranted : 0,
      revisionNote: typeof data.revisionNote === "string" ? data.revisionNote : undefined,
      completedAtMs: toMillis(data.completedAt),
    };
  });

  const leaderboard: ChapterVolunteer[] = leaderboardSnap
    ? leaderboardSnap.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          uid: doc.id,
          username: typeof data.username === "string" ? data.username : "",
          role: data.role === "coordinator" ? "coordinator" : "volunteer",
          chapterId: typeof data.chapterId === "string" ? data.chapterId : "",
          xp: typeof data.xp === "number" ? data.xp : 0,
          teams: asStringArray(data.teams),
          avatarOptions: data.avatarOptions as AvatarOptions | undefined,
        };
      })
    : [];

  const activityEntries: SerializedXpLogEntry[] = xpLogSnap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      logId: doc.id,
      source: typeof data.source === "string" ? data.source : "quest_completion",
      description: typeof data.description === "string" ? data.description : "",
      xp: typeof data.xp === "number" ? data.xp : 0,
      createdAtMs: toMillis(data.createdAt),
    };
  });

  return {
    user: {
      uid,
      username: typeof rawUser.username === "string" ? rawUser.username : "",
      role,
      chapterId,
      teams: asStringArray(rawUser.teams),
      xp: typeof rawUser.xp === "number" ? rawUser.xp : 0,
      linkedinUrl: typeof rawUser.linkedinUrl === "string" ? rawUser.linkedinUrl : undefined,
      githubUrl: typeof rawUser.githubUrl === "string" ? rawUser.githubUrl : undefined,
      createdAtMs: toMillis(rawUser.createdAt),
      avatarOptions: rawUser.avatarOptions as AvatarOptions | undefined,
      starsReceived: typeof rawUser.starsReceived === "number" ? rawUser.starsReceived : 0,
    },
    quests: questsSnap.docs.map((doc) => ({ questId: doc.id, ...(doc.data() as Omit<Quest, "questId">) })),
    completions,
    leaderboard,
    activityEntries: activityEntries.slice(0, 20),
    hasMoreActivity: activityEntries.length === 21,
    reflectionCount: reflectionsSnap.size,
    eventCount: eventXpSnap.size,
    profileSetupCount: profileSetupSnap.size,
  };
}
