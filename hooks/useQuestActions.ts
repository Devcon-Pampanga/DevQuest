"use client";

import { useState } from "react";
import {
  doc,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addXpRewardToBatch } from "@/lib/devCoins";
import { Quest, QuestCompletion, ApprovalsQueueItem } from "@/types/quest";
import {
  SUBQUEST_COMPLETIONS_COLLECTION,
  Mission,
  MissionCompletion,
  MissionApprovalItem,
} from "@/types/mission";

interface QuestActionsOptions {
  uid: string;
  setCompletions: React.Dispatch<React.SetStateAction<Record<string, QuestCompletion>>>;
  setMissionCompletions: React.Dispatch<React.SetStateAction<Record<string, MissionCompletion>>>;
  setApprovals: React.Dispatch<React.SetStateAction<ApprovalsQueueItem[]>>;
  setMissionApprovals: React.Dispatch<React.SetStateAction<MissionApprovalItem[]>>;
  setExpandedQuestId: (id: string | null) => void;
  setExpandedMissionId: (id: string | null) => void;
}

export function useQuestActions({
  uid,
  setCompletions,
  setMissionCompletions,
  setApprovals,
  setMissionApprovals,
  setExpandedQuestId,
  setExpandedMissionId,
}: QuestActionsOptions) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSelfMark(quest: Quest) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      batch.set(doc(db, "users", uid, "questCompletions", quest.questId), {
        questId: quest.questId,
        status: "completed",
        xpGranted: quest.xpReward,
        completedAt: now,
      });
      addXpRewardToBatch({
        firestore: db,
        uid,
        xp: quest.xpReward,
        source: "quest_completion",
        sourceId: quest.questId,
        description: `Completed: ${quest.name}`,
        batch,
        createdAt: now,
      });
      await batch.commit();
      setCompletions((prev) => ({
        ...prev,
        [quest.questId]: {
          questId: quest.questId,
          status: "completed",
          xpGranted: quest.xpReward,
          completedAt: Timestamp.now(),
        },
      }));
      setExpandedQuestId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitApproval(quest: Quest, notes: string, evidence: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "users", uid, "questCompletions", quest.questId), {
        questId: quest.questId,
        status: "pending_approval",
        submissionNotes: notes,
        evidenceUrl: evidence || null,
        xpGranted: quest.xpReward,
        updatedAt: serverTimestamp(),
      });
      setCompletions((prev) => ({
        ...prev,
        [quest.questId]: {
          questId: quest.questId,
          status: "pending_approval",
          submissionNotes: notes,
          evidenceUrl: evidence || undefined,
          xpGranted: quest.xpReward,
        },
      }));
      setExpandedQuestId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(item: ApprovalsQueueItem) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      batch.update(doc(db, "users", item.userId, "questCompletions", item.questId), {
        status: "completed",
        completedAt: now,
        approvedBy: uid,
      });
      addXpRewardToBatch({
        firestore: db,
        uid: item.userId,
        xp: item.xpReward,
        source: "quest_completion",
        sourceId: item.questId,
        description: `Quest approved: ${item.questName}`,
        batch,
        createdAt: now,
      });
      const notificationRef = doc(collection(db, "users", item.userId, "notifications"));
      batch.set(notificationRef, {
        type: "quest_approved",
        message: `Your quest "${item.questName}" was approved! +${item.xpReward} XP`,
        read: false,
        relatedId: item.questId,
        createdAt: now,
      });
      await batch.commit();
      setApprovals((prev) =>
        prev.filter((a) => !(a.userId === item.userId && a.questId === item.questId))
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevise(item: ApprovalsQueueItem, revisionNote: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      await updateDoc(doc(db, "users", item.userId, "questCompletions", item.questId), {
        status: "in_progress",
        revisionNote,
        updatedAt: now,
      });
      await addDoc(collection(db, "users", item.userId, "notifications"), {
        type: "quest_revision",
        message: `Revision requested for "${item.questName}": ${revisionNote}`,
        read: false,
        relatedId: item.questId,
        createdAt: now,
      });
      setApprovals((prev) =>
        prev.filter((a) => !(a.userId === item.userId && a.questId === item.questId))
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Mission actions ──────────────────────────────────────────────────────────

  async function handleJoinMission(mission: Mission) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "users", uid, SUBQUEST_COMPLETIONS_COLLECTION, mission.missionId), {
        subquestId: mission.missionId,
        subquestTitle: mission.title,
        difficulty: mission.difficulty,
        status: "joined",
        xpGranted: mission.xpReward,
      });
      setMissionCompletions((prev) => ({
        ...prev,
        [mission.missionId]: {
          missionId: mission.missionId,
          status: "joined",
          xpGranted: mission.xpReward,
        },
      }));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitMission(mission: Mission, notes: string, evidenceUrl: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "users", uid, SUBQUEST_COMPLETIONS_COLLECTION, mission.missionId), {
        subquestId: mission.missionId,
        subquestTitle: mission.title,
        difficulty: mission.difficulty,
        status: "submitted",
        submissionNotes: notes,
        evidenceUrl: evidenceUrl || null,
        xpGranted: mission.xpReward,
        updatedAt: serverTimestamp(),
      });
      setMissionCompletions((prev) => ({
        ...prev,
        [mission.missionId]: {
          missionId: mission.missionId,
          status: "submitted",
          submissionNotes: notes,
          evidenceUrl: evidenceUrl || undefined,
          xpGranted: mission.xpReward,
        },
      }));
      setExpandedMissionId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproveMission(item: MissionApprovalItem) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      batch.update(doc(db, "users", item.userId, SUBQUEST_COMPLETIONS_COLLECTION, item.missionId), {
        status: "completed",
        completedAt: now,
        approvedBy: uid,
      });
      addXpRewardToBatch({
        firestore: db,
        uid: item.userId,
        xp: item.xpReward,
        source: "quest_completion",
        sourceId: item.missionId,
        description: `Subquest approved: ${item.missionTitle}`,
        batch,
        createdAt: now,
      });
      const notificationRef = doc(collection(db, "users", item.userId, "notifications"));
      batch.set(notificationRef, {
        type: "quest_approved",
        message: `Your subquest "${item.missionTitle}" was approved! +${item.xpReward} XP`,
        read: false,
        relatedId: item.missionId,
        createdAt: now,
      });
      await batch.commit();
      setMissionApprovals((prev) =>
        prev.filter((a) => !(a.userId === item.userId && a.missionId === item.missionId))
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviseMission(item: MissionApprovalItem, revisionNote: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      await updateDoc(doc(db, "users", item.userId, SUBQUEST_COMPLETIONS_COLLECTION, item.missionId), {
        status: "joined",
        revisionNote,
        updatedAt: now,
      });
      await addDoc(collection(db, "users", item.userId, "notifications"), {
        type: "quest_revision",
        message: `Revision requested for subquest "${item.missionTitle}": ${revisionNote}`,
        read: false,
        relatedId: item.missionId,
        createdAt: now,
      });
      setMissionApprovals((prev) =>
        prev.filter((a) => !(a.userId === item.userId && a.missionId === item.missionId))
      );
    } finally {
      setSubmitting(false);
    }
  }

  return {
    submitting,
    handleSelfMark,
    handleSubmitApproval,
    handleApprove,
    handleRevise,
    handleJoinMission,
    handleSubmitMission,
    handleApproveMission,
    handleReviseMission,
  };
}
