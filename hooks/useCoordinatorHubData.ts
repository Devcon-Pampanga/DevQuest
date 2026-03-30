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
import type { Mission } from "@/types/mission";
import { TIER_ORDER } from "@/lib/seed/quests";

export type VolunteerTier = "team_member" | "associate" | "specialist" | "lead";

export interface VolunteerWithTier extends ChapterVolunteer {
  /** Highest tier reached across all of the volunteer's teams (null if no teamProgress). */
  highestTier: VolunteerTier | null;
}

export interface CoordinatorHubData {
  volunteers: VolunteerWithTier[];
  missions: Mission[];
  pendingApprovalsCount: number;
  loading: boolean;
  refresh: () => void;
}

/**
 * Loads all data needed for the Coordinator Hub page:
 *  - chapter volunteers (role === "volunteer") with their highest team tier
 *  - chapter missions (all statuses — UI filters active/closed)
 *  - count of pending quest + mission approvals across all volunteers
 */
export function useCoordinatorHubData(chapterId: string): CoordinatorHubData {
  const [volunteers, setVolunteers] = useState<VolunteerWithTier[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
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

      // ── 3. Load all chapter missions (both active + closed) ──────────────────
      const missionsSnap = await getDocs(
        query(collection(db, "missions"), where("chapterId", "==", chapterId))
      );
      setMissions(
        missionsSnap.docs.map((d) => ({ ...d.data(), missionId: d.id } as Mission))
      );

      // ── 4. Count pending approvals (quest + mission) ─────────────────────────
      let approvalCount = 0;
      await Promise.all(
        volunteerDocs.map(async (vDoc) => {
          const [questPending, missionPending] = await Promise.all([
            getDocs(
              query(
                collection(db, "users", vDoc.id, "questCompletions"),
                where("status", "==", "pending_approval")
              )
            ),
            getDocs(
              query(
                collection(db, "users", vDoc.id, "missionCompletions"),
                where("status", "==", "submitted")
              )
            ),
          ]);
          approvalCount += questPending.size + missionPending.size;
        })
      );
      setPendingApprovalsCount(approvalCount);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    load();
  }, [load]);

  return { volunteers, missions, pendingApprovalsCount, loading, refresh: load };
}
