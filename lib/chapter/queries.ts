import {
  collection,
  getDocs,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChapterVolunteer, ChapterEventDoc } from "@/types/chapter";

export interface ChapterData {
  volunteers: ChapterVolunteer[];
  events: ChapterEventDoc[];
  regCounts: Record<string, number>;
}

export async function fetchChapterData(
  chapterId: string
): Promise<ChapterData> {
  const [usersSnap, eventsSnap] = await Promise.all([
    getDocs(
      query(collection(db, "users"), where("chapterId", "==", chapterId))
    ),
    getDocs(
      query(collection(db, "events"), where("chapterId", "==", chapterId))
    ),
  ]);

  const volunteers = usersSnap.docs.map(
    (d) => ({ ...d.data(), uid: d.id } as ChapterVolunteer)
  );

  const events = eventsSnap.docs
    .map((d) => ({ ...d.data(), eventId: d.id } as ChapterEventDoc))
    .sort((a, b) => b.date.toMillis() - a.date.toMillis());

  const recentSlice = events.slice(0, 12);
  const counts = await Promise.all(
    recentSlice.map(async (ev) => {
      const snap = await getCountFromServer(
        collection(db, "events", ev.eventId, "registrations")
      );
      return [ev.eventId, snap.data().count] as [string, number];
    })
  );

  return {
    volunteers,
    events,
    regCounts: Object.fromEntries(counts) as Record<string, number>,
  };
}
