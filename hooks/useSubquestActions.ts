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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addXpRewardToBatch } from "@/lib/devCoins";
import {
  SUBQUEST_COMPLETIONS_COLLECTION,
  type Subquest,
  type SubquestCompletion,
  type SubquestApprovalItem,
} from "@/types/subquest";

interface SubquestActionsOptions {
  uid: string;
  setSubquestCompletions: React.Dispatch<React.SetStateAction<Record<string, SubquestCompletion>>>;
  setSubquestApprovals: React.Dispatch<React.SetStateAction<SubquestApprovalItem[]>>;
  setExpandedSubquestId: (id: string | null) => void;
}

export function useSubquestActions({
  uid,
  setSubquestCompletions,
  setSubquestApprovals,
  setExpandedSubquestId,
}: SubquestActionsOptions) {
  const [submitting, setSubmitting] = useState(false);

  async function handleJoinSubquest(subquest: Subquest) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "users", uid, SUBQUEST_COMPLETIONS_COLLECTION, subquest.subquestId), {
        subquestId: subquest.subquestId,
        subquestTitle: subquest.title,
        difficulty: subquest.difficulty,
        status: "joined",
        xpGranted: subquest.xpReward,
      });
      setSubquestCompletions((prev) => ({
        ...prev,
        [subquest.subquestId]: {
          subquestId: subquest.subquestId,
          status: "joined",
          xpGranted: subquest.xpReward,
        },
      }));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitSubquest(subquest: Subquest, notes: string, evidenceUrl: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "users", uid, SUBQUEST_COMPLETIONS_COLLECTION, subquest.subquestId), {
        subquestId: subquest.subquestId,
        subquestTitle: subquest.title,
        difficulty: subquest.difficulty,
        status: "submitted",
        submissionNotes: notes,
        evidenceUrl: evidenceUrl || null,
        xpGranted: subquest.xpReward,
        updatedAt: serverTimestamp(),
      });
      setSubquestCompletions((prev) => ({
        ...prev,
        [subquest.subquestId]: {
          subquestId: subquest.subquestId,
          status: "submitted",
          submissionNotes: notes,
          evidenceUrl: evidenceUrl || undefined,
          xpGranted: subquest.xpReward,
        },
      }));
      setExpandedSubquestId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproveSubquest(item: SubquestApprovalItem) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      batch.update(doc(db, "users", item.userId, SUBQUEST_COMPLETIONS_COLLECTION, item.subquestId), {
        status: "completed",
        completedAt: now,
        approvedBy: uid,
      });
      addXpRewardToBatch({
        firestore: db,
        uid: item.userId,
        xp: item.xpReward,
        source: "quest_completion",
        sourceId: item.subquestId,
        description: `Subquest approved: ${item.subquestTitle}`,
        batch,
        createdAt: now,
      });
      const notificationRef = doc(collection(db, "users", item.userId, "notifications"));
      batch.set(notificationRef, {
        type: "quest_approved",
        message: `Your subquest "${item.subquestTitle}" was approved! +${item.xpReward} XP`,
        read: false,
        relatedId: item.subquestId,
        createdAt: now,
      });
      await batch.commit();
      setSubquestApprovals((prev) =>
        prev.filter((a) => !(a.userId === item.userId && a.subquestId === item.subquestId))
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviseSubquest(item: SubquestApprovalItem, revisionNote: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      await updateDoc(doc(db, "users", item.userId, SUBQUEST_COMPLETIONS_COLLECTION, item.subquestId), {
        status: "joined",
        revisionNote,
        updatedAt: now,
      });
      await addDoc(collection(db, "users", item.userId, "notifications"), {
        type: "quest_revision",
        message: `Revision requested for subquest "${item.subquestTitle}": ${revisionNote}`,
        read: false,
        relatedId: item.subquestId,
        createdAt: now,
      });
      setSubquestApprovals((prev) =>
        prev.filter((a) => !(a.userId === item.userId && a.subquestId === item.subquestId))
      );
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, handleJoinSubquest, handleSubmitSubquest, handleApproveSubquest, handleReviseSubquest };
}
