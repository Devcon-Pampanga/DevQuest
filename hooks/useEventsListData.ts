"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, getCountFromServer, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChapterEventDoc, ChapterSessionUser } from "@/types/chapter";

export function useEventsListData(userData: ChapterSessionUser | null) {
  const [events, setEvents] = useState<ChapterEventDoc[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  useEffect(() => {
    if (!userData) return;

    async function fetchEvents() {
      setLoadingEvents(true);
      try {
        const q = query(collection(db, "events"));
        const snapshot = await getDocs(q);
        const now = Date.now();
        const docs = snapshot.docs
          .map((d) => ({ eventId: d.id, ...d.data() }) as ChapterEventDoc)
          .sort((a, b) => {
            const aUp = a.date.toMillis() > now;
            const bUp = b.date.toMillis() > now;
            if (aUp && !bUp) return -1;
            if (!aUp && bUp) return 1;
            if (aUp && bUp) return a.date.toMillis() - b.date.toMillis();
            return b.date.toMillis() - a.date.toMillis();
          });
        setEvents(docs);
        setCountsLoading(true);
        const countEntries = await Promise.all(
          docs.map(async (event) => {
            const snap = await getCountFromServer(
              collection(db, "events", event.eventId, "registrations")
            );
            return [event.eventId, snap.data().count] as [string, number];
          })
        );
        setRegistrationCounts(Object.fromEntries(countEntries));
        setCountsLoading(false);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setFetchError("Could not load events. Check the console for details.");
      } finally {
        setLoadingEvents(false);
      }
    }

    fetchEvents();
  }, [userData]);

  return {
    events,
    loadingEvents,
    fetchError,
    registrationCounts,
    countsLoading,
  };
}
