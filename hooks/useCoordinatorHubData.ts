"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChapterVolunteer } from "@/types/chapter";
import {
  SUBQUESTS_COLLECTION,
  SUBQUEST_COMPLETIONS_COLLECTION,
  getSubquestIdFromData,
  getSubquestTitleFromData,
  type Subquest,
  type SubquestApprovalItem,
} from "@/types/subquest";
import { TIER_ORDER } from "@/lib/seed/quests";

export type VolunteerTier = "team_member" | "associate" | "specialist" | "lead";

export interface VolunteerWithTier extends ChapterVolunteer {
  /** Highest tier reached across all of the volunteer's teams (null if no teamProgress). */
  highestTier: VolunteerTier | null;
}

export interface CoordinatorHubData {
  volunteers: VolunteerWithTier[];
  subquests: Subquest[];
  subquestApprovals: SubquestApprovalItem[];
  pendingApprovalsCount: number;
  loading: boolean;
  refresh: () => void;
}

/**
 * Loads all data needed for the Coordinator Hub page:
 *  - chapter volunteers (role === "volunteer") with their highest team tier
 *  - chapter subquests (all statuses — UI filters active/closed)
 *  - count of pending quest + subquest approvals across all volunteers
 */
export function useCoordinatorHubData(chapterId: string): CoordinatorHubData {
  const [volunteers, setVolunteers] = useState<VolunteerWithTier[]>([]);
  const [subquests, setSubquests] = useState<Subquest[]>([]);
  const [subquestApprovals, setSubquestApprovals] = useState<SubquestApprovalItem[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!chapterId) return;
    setLoading(true);

    try {
      // ── 1. Load volunteers ────────────────────────────────────────────────────
      const volunteersSnap = await getDocs(
        query(
          collection(db, "users"),
          where("chapterId", "==", chapterId),
          where("role", "==", "volunteer")
        )
      );

      const volunteerDocs = volunteersSnap.docs;

      // ── 2. Load teamProgress for each volunteer (parallel) ───────────────────
      const tiersPerVolunteer = await Promise.all(
        volunteerDocs.map(async (vDoc) => {
          const snap = await getDocs(collection(db, "users", vDoc.id, "teamProgress"));
          if (snap.empty) return null;

          let best: VolunteerTier | null = null;
          snap.docs.forEach((d) => {
            const tier = (d.data() as { currentTier: VolunteerTier }).currentTier;
            if (!best || TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(best)) {
              best = tier;
            }
          });
          return best;
        })
      );

      const volunteerList: VolunteerWithTier[] = volunteerDocs.map((vDoc, i) => {
        const data = vDoc.data();
        return {
          uid: vDoc.id,
          username: data.username as string,
          role: "volunteer",
          chapterId: data.chapterId as string,
          xp: data.xp as number,
          teams: (data.teams as string[]) ?? [],
          avatarOptions: data.avatarOptions,
          highestTier: tiersPerVolunteer[i],
        };
      });

      setVolunteers(volunteerList);

      // ── 3. Load all chapter subquests (both active + closed) ─────────────────
      const subquestsSnap = await getDocs(
        query(collection(db, SUBQUESTS_COLLECTION), where("chapterId", "==", chapterId))
      );
      setSubquests(
        subquestsSnap.docs.map(
          (d) =>
            ({
              ...d.data(),
              subquestId: getSubquestIdFromData(d.data() as Record<string, unknown>, d.id),
            } as Subquest)
        )
      );

      // ── 4. Count pending approvals (quest + subquest) ────────────────────────
      let approvalCount = 0;
      const nextSubquestApprovals: SubquestApprovalItem[] = [];
      await Promise.all(
        volunteerDocs.map(async (vDoc) => {
          const [questPending, subquestPending] = await Promise.all([
            getDocs(
              query(
                collection(db, "users", vDoc.id, "questCompletions"),
                where("status", "==", "pending_approval")
              )
            ),
            getDocs(
              query(
                collection(db, "users", vDoc.id, SUBQUEST_COMPLETIONS_COLLECTION),
                where("status", "==", "submitted")
              )
            ),
          ]);
          approvalCount += questPending.size + subquestPending.size;

          const volunteerData = vDoc.data();
          subquestPending.docs.forEach((pendingDoc) => {
            const pendingData = pendingDoc.data() as Record<string, unknown>;
            nextSubquestApprovals.push({
              userId: vDoc.id,
              username: (volunteerData.username as string) ?? vDoc.id,
              avatarOptions: volunteerData.avatarOptions as SubquestApprovalItem["avatarOptions"],
              subquestId: getSubquestIdFromData(pendingData, pendingDoc.id),
              subquestTitle: getSubquestTitleFromData(pendingData),
              difficulty: (pendingData.difficulty as SubquestApprovalItem["difficulty"]) ?? "medium",
              xpReward: (pendingData.xpGranted as number) ?? 0,
              submissionNotes: pendingData.submissionNotes as string | undefined,
              evidenceUrl: pendingData.evidenceUrl as string | undefined,
              submittedAt: pendingData.updatedAt as SubquestApprovalItem["submittedAt"],
            });
          });
        })
      );
      setPendingApprovalsCount(approvalCount);
      setSubquestApprovals(nextSubquestApprovals);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    volunteers,
    subquests,
    subquestApprovals,
    pendingApprovalsCount,
    loading,
    refresh: load,
  };
}
