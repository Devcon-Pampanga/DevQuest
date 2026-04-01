import { collection, getDocs, getCountFromServer, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChapterEventDoc } from "@/types/chapter";

export async function fetchEventsWithCounts() {
  const snapshot = await getDocs(query(collection(db, "events")));
  const now = Date.now();
  const events = snapshot.docs
    .map((d) => ({ eventId: d.id, ...d.data() }) as ChapterEventDoc)
    .sort((a, b) => {
      const aUp = a.date.toMillis() > now;
      const bUp = b.date.toMillis() > now;
      if (aUp && !bUp) return -1;
      if (!aUp && bUp) return 1;
      if (aUp && bUp) return a.date.toMillis() - b.date.toMillis();
      return b.date.toMillis() - a.date.toMillis();
    });

  const countEntries = await Promise.all(
    events.map(async (event) => {
      const snap = await getCountFromServer(
        collection(db, "events", event.eventId, "registrations")
      );
      return [event.eventId, snap.data().count] as [string, number];
    })
  );

  return {
    events,
    registrationCounts: Object.fromEntries(countEntries) as Record<string, number>,
  };
}
