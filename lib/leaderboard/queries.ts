import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChapterVolunteer } from "@/types/chapter";

export async function fetchLeaderboardVolunteers(
  chapterId: string
): Promise<ChapterVolunteer[]> {
  const snap = await getDocs(
    query(collection(db, "users"), where("chapterId", "==", chapterId))
  );
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as ChapterVolunteer));
}
