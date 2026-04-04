import {
  collection,
  getDocs,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Quest, QuestCompletion } from "@/types/quest";
import {
  SUBQUESTS_COLLECTION,
  SUBQUEST_COMPLETIONS_COLLECTION,
  getMissionIdFromData,
  type Mission,
  type MissionCompletion,
} from "@/types/mission";

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
        collection(db, SUBQUESTS_COLLECTION),
        where("chapterId", "==", chapterId),
        where("status", "==", "active")
      )
    ),
    getDocs(collection(db, "users", uid, SUBQUEST_COMPLETIONS_COLLECTION)),
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
    const data = d.data() as Record<string, unknown>;
    const missionId = getMissionIdFromData(data, d.id);
    missionCompletions[d.id] = {
      ...(data as unknown as MissionCompletion),
      missionId,
    };
  });

  return {
    quests: questsSnap.docs.map((d) => d.data() as Quest),
    completions,
    missions: missionsSnap.docs.map(
      (d) => ({ ...d.data(), missionId: getMissionIdFromData(d.data() as Record<string, unknown>, d.id) } as Mission)
    ),
    missionCompletions,
    reflectionCount: reflCountSnap.data().count,
    eventCount: eventCountSnap.data().count,
    profileSetupCount: profileSetupSnap.data().count,
  };
}
