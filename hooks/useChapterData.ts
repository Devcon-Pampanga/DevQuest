"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChapterVolunteer, ChapterEventDoc } from "@/types/chapter";

export function useChapterData(viewingChapterId: string) {
  const [volunteers, setVolunteers] = useState<ChapterVolunteer[]>([]);
  const [events, setEvents] = useState<ChapterEventDoc[]>([]);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [loadingChapter, setLoadingChapter] = useState(true);

  useEffect(() => {
    if (!viewingChapterId) return;
    let cancelled = false;

    async function fetchChapterData() {
      setLoadingChapter(true);
      setVolunteers([]);
      setEvents([]);
      setRegCounts({});
      try {
        const [usersSnap, eventsSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), where("chapterId", "==", viewingChapterId))),
          getDocs(query(collection(db, "events"), where("chapterId", "==", viewingChapterId))),
        ]);

        if (cancelled) return;

        const vols = usersSnap.docs.map(
          (d) => ({ ...d.data(), uid: d.id } as ChapterVolunteer)
        );
        setVolunteers(vols);

        const evDocs = eventsSnap.docs
          .map((d) => ({ ...d.data(), eventId: d.id } as ChapterEventDoc))
          .sort((a, b) => b.date.toMillis() - a.date.toMillis());
        setEvents(evDocs);

        const recentSlice = evDocs.slice(0, 12);
        const counts = await Promise.all(
          recentSlice.map(async (ev) => {
            const snap = await getCountFromServer(
              collection(db, "events", ev.eventId, "registrations")
            );
            return [ev.eventId, snap.data().count] as [string, number];
          })
        );
        if (!cancelled) {
          setRegCounts(Object.fromEntries(counts));
        }
      } catch (err) {
        console.error("Failed to fetch chapter data:", err);
      } finally {
        if (!cancelled) setLoadingChapter(false);
      }
    }

    fetchChapterData();
    return () => {
      cancelled = true;
    };
  }, [viewingChapterId]);

  return {
    loadingChapter,
    volunteers,
    setVolunteers,
    events,
    regCounts,
  };
}
