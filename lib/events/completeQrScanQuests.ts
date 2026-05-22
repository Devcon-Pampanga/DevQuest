import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Quest, QuestCompletion } from "@/types/quest";
import type { EventDoc } from "./types";

const TIER_ORDER: Quest["tier"][] = ["team_member", "associate", "specialist", "lead"];

/**
 * Auto-complete the next eligible qr_scan quest for each team when attendance is confirmed.
 * Fire-and-forget side effects; errors are logged by caller.
 */
export async function completeQrScanQuestsForAttendance(
  db: Firestore,
  regUserId: string,
  volunteerRole: string,
  event: EventDoc | null,
  eventQuests: Quest[]
): Promise<void> {
  const eventType = event?.eventType;

  const [volunteerSnap, completionsSnap] = await Promise.all([
    getDoc(doc(db, "users", regUserId)),
    getDocs(collection(db, "users", regUserId, "questCompletions")),
  ]);

  const volunteerTeams: string[] = volunteerSnap.data()?.teams ?? [];
  const completions: Record<string, QuestCompletion> = {};
  completionsSnap.docs.forEach((d) => {
    completions[d.id] = d.data() as QuestCompletion;
  });

  for (const teamId of volunteerTeams) {
    let currentTier: Quest["tier"] = "team_member";
    for (const tier of TIER_ORDER) {
      const tierIdx = TIER_ORDER.indexOf(tier);
      if (tierIdx > 0) {
        const prevTier = TIER_ORDER[tierIdx - 1];
        const prevQuests = eventQuests.filter((q) => q.teamId === teamId && q.tier === prevTier);
        const prevDone = prevQuests.every((q) => completions[q.questId]?.status === "completed");
        if (!prevDone) break;
      }
      const tierQuests = eventQuests.filter((q) => q.teamId === teamId && q.tier === tier);
      const tierDone = tierQuests.every((q) => completions[q.questId]?.status === "completed");
      if (!tierDone) {
        currentTier = tier;
        break;
      }
    }

    const toComplete = eventQuests.filter((q) => {
      if (q.teamId !== teamId) return false;
      if (q.tier !== currentTier) return false;
      if (q.completionMethod !== "qr_scan") return false;
      if (completions[q.questId]?.status === "completed") return false;
      if (!q.triggerEventType || q.triggerEventType !== eventType) return false;
      if (q.triggerRole && !volunteerRole.toLowerCase().includes(q.triggerRole.toLowerCase())) return false;
      return true;
    });

    const quest = toComplete[0];
    if (quest) {
      await setDoc(doc(db, "users", regUserId, "questCompletions", quest.questId), {
        questId: quest.questId,
        status: "completed",
        completedAt: serverTimestamp(),
        xpGranted: quest.xpReward,
      });
      await addDoc(collection(db, "users", regUserId, "notifications"), {
        type: "quest_approved",
        message: `Quest completed: "${quest.name}"!`,
        read: false,
        relatedId: quest.questId,
        createdAt: serverTimestamp(),
      });
    }
  }
}
