import "server-only";

import type { AvatarOptions } from "@/lib/avatar";
import { getFirebaseAdminOrThrow } from "@/lib/firebase-admin";
import type { Quest, QuestCompletion } from "@/types/quest";

export interface DashboardProfileIdentity {
  uid: string;
  username: string;
  email: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  teams: string[];
  createdAtMs?: number;
  avatarOptions?: AvatarOptions;
}

export interface DashboardProfileProgression {
  xp: number;
  devCoins: number;
  starsReceived: number;
}

export interface SerializedQuestCompletion extends Omit<QuestCompletion, "completedAt"> {
  completedAtMs?: number;
}

export interface DashboardProfilePayload {
  identity: DashboardProfileIdentity;
  progression: DashboardProfileProgression;
  socials: {
    githubUrl?: string;
    linkedinUrl?: string;
  };
  quests: Quest[];
  completions: Record<string, SerializedQuestCompletion>;
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

export async function getDashboardProfilePayload(uid: string): Promise<DashboardProfilePayload | null> {
  const { db } = getFirebaseAdminOrThrow();
  const userSnap = await db.collection("users").doc(uid).get();

  if (!userSnap.exists) {
    return null;
  }

  const rawUser = userSnap.data() as Record<string, unknown>;
  const role = rawUser.role === "coordinator" ? "coordinator" : "volunteer";

  const [questsSnap, completionsSnap, reflectionsSnap, eventXpSnap, profileSetupSnap] = await Promise.all([
    db.collection("quests").get(),
    db.collection("users").doc(uid).collection("questCompletions").get(),
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

  return {
    identity: {
      uid,
      username: typeof rawUser.username === "string" ? rawUser.username : "",
      email: typeof rawUser.email === "string" ? rawUser.email : "",
      role,
      chapterId: typeof rawUser.chapterId === "string" ? rawUser.chapterId : "",
      teams: asStringArray(rawUser.teams),
      createdAtMs: toMillis(rawUser.createdAt),
      avatarOptions: rawUser.avatarOptions as AvatarOptions | undefined,
    },
    progression: {
      xp: typeof rawUser.xp === "number" ? rawUser.xp : 0,
      devCoins: typeof rawUser.devCoins === "number" ? rawUser.devCoins : 0,
      starsReceived: typeof rawUser.starsReceived === "number" ? rawUser.starsReceived : 0,
    },
    socials: {
      githubUrl: typeof rawUser.githubUrl === "string" ? rawUser.githubUrl : undefined,
      linkedinUrl: typeof rawUser.linkedinUrl === "string" ? rawUser.linkedinUrl : undefined,
    },
    quests: questsSnap.docs.map((doc) => ({ questId: doc.id, ...(doc.data() as Omit<Quest, "questId">) })),
    completions,
    reflectionCount: reflectionsSnap.size,
    eventCount: eventXpSnap.size,
    profileSetupCount: profileSetupSnap.size,
  };
}
