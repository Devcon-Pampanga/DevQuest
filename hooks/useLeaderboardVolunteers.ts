"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChapterVolunteer } from "@/types/chapter";

export function useLeaderboardVolunteers(viewingChapterId: string) {
  const [volunteers, setVolunteers] = useState<ChapterVolunteer[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!viewingChapterId) return;
    let cancelled = false;

    async function fetchData() {
      setLoadingData(true);
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("chapterId", "==", viewingChapterId))
        );
        if (!cancelled) {
          setVolunteers(snap.docs.map((d) => ({ ...d.data(), uid: d.id } as ChapterVolunteer)));
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard data:", err);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [viewingChapterId]);

  return { volunteers, loadingData };
}
