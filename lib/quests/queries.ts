import {
  collection,
  getDocs,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Quest, QuestCompletion } from "@/types/quest";
import type { Mission, MissionCompletion } from "@/types/mission";

export interface QuestPageData {
  quests: Quest[];
  completions: Record<string, QuestCompletion>;
  missions: Mission[];
  missionCompletions: Record<string, MissionCompletion>;
  reflectionCount: number;
  eventCount: number;
  profileSetupCount: number;
}

export async function fetchQuestPageData(
  uid: string,
  chapterId: string
): Promise<QuestPageData> {
  const xpCol = collection(db, "users", uid, "xpLog");
  const [
    questsSnap,
    completionsSnap,
    missionsSnap,
    missionCompletionsSnap,
    reflCountSnap,
    eventCountSnap,
    profileSetupSnap,
  ] = await Promise.all([
    getDocs(collection(db, "quests")),
    getDocs(collection(db, "users", uid, "questCompletions")),
    getDocs(
      query(
        collection(db, "missions"),
        where("chapterId", "==", chapterId),
        where("status", "==", "active")
      )
    ),
    getDocs(collection(db, "users", uid, "missionCompletions")),
    getCountFromServer(collection(db, "users", uid, "reflections")),
    getCountFromServer(query(xpCol, where("source", "==", "event_attendance"))),
    getCountFromServer(query(xpCol, where("source", "==", "profile_setup"))),
  ]);

  const completions: Record<string, QuestCompletion> = {};
  completionsSnap.docs.forEach((d) => {
    completions[d.id] = d.data() as QuestCompletion;
  });

  const missionCompletions: Record<string, MissionCompletion> = {};
  missionCompletionsSnap.docs.forEach((d) => {
    missionCompletions[d.id] = d.data() as MissionCompletion;
  });

  return {
    quests: questsSnap.docs.map((d) => d.data() as Quest),
    completions,
    missions: missionsSnap.docs.map(
      (d) => ({ ...d.data(), missionId: d.id } as Mission)
    ),
    missionCompletions,
    reflectionCount: reflCountSnap.data().count,
    eventCount: eventCountSnap.data().count,
    profileSetupCount: profileSetupSnap.data().count,
  };
}
