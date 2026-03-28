"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Quest, QuestCompletion } from "@/types/quest";
import { Mission, MissionCompletion } from "@/types/mission";

export interface QuestDataResult {
  quests: Quest[];
  completions: Record<string, QuestCompletion>;
  setCompletions: React.Dispatch<React.SetStateAction<Record<string, QuestCompletion>>>;
  missions: Mission[];
  setMissions: React.Dispatch<React.SetStateAction<Mission[]>>;
  missionCompletions: Record<string, MissionCompletion>;
  setMissionCompletions: React.Dispatch<React.SetStateAction<Record<string, MissionCompletion>>>;
  reflectionCount: number;
  eventCount: number;
  profileSetupCount: number;
  loadingQuests: boolean;
  loadingMissions: boolean;
}

/**
 * Fetches all quest/mission data for a given user.
 * Only fires once uid and chapterId are non-empty.
 */
export function useQuestData(uid: string, chapterId: string): QuestDataResult {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<Record<string, QuestCompletion>>({});
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<Record<string, MissionCompletion>>({});
  const [reflectionCount, setReflectionCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [profileSetupCount, setProfileSetupCount] = useState(0);
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [loadingMissions, setLoadingMissions] = useState(true);

  useEffect(() => {
    if (!uid || !chapterId) return;

    async function load() {
      setLoadingQuests(true);
      setLoadingMissions(true);
      try {
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

        setQuests(questsSnap.docs.map((d) => d.data() as Quest));

        const cmap: Record<string, QuestCompletion> = {};
        completionsSnap.docs.forEach((d) => { cmap[d.id] = d.data() as QuestCompletion; });
        setCompletions(cmap);

        setMissions(
          missionsSnap.docs.map((d) => ({ ...d.data(), missionId: d.id } as Mission))
        );

        const mmap: Record<string, MissionCompletion> = {};
        missionCompletionsSnap.docs.forEach((d) => { mmap[d.id] = d.data() as MissionCompletion; });
        setMissionCompletions(mmap);

        setReflectionCount(reflCountSnap.data().count);
        setEventCount(eventCountSnap.data().count);
        setProfileSetupCount(profileSetupSnap.data().count);
      } finally {
        setLoadingQuests(false);
        setLoadingMissions(false);
      }
    }

    load();
  }, [uid, chapterId]);

  return {
    quests,
    completions,
    setCompletions,
    missions,
    setMissions,
    missionCompletions,
    setMissionCompletions,
    reflectionCount,
    eventCount,
    profileSetupCount,
    loadingQuests,
    loadingMissions,
  };
}
