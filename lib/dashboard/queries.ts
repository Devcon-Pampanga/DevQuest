import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChapterEventDoc } from "@/types/chapter";
import type { Quest, QuestCompletion } from "@/types/quest";
import type { PendingReflection, DashboardLeaderboardEntry } from "@/types/dashboard";
import type { AvatarOptions } from "@/lib/avatar";

interface RegistrationDoc {
  attended: boolean;
  reflectionSubmitted: boolean;
  reflectionDeadline?: Timestamp;
}

function hoursUntil(ts: Timestamp): number {
  return Math.max(0, Math.floor((ts.toDate().getTime() - Date.now()) / 3600000));
}

export interface DashboardData {
  allQuests: Quest[];
  completions: Record<string, QuestCompletion>;
  eventsAttendedCount: number;
  events: ChapterEventDoc[];
  pendingReflection: PendingReflection | null;
  eventsThisMonthCount: number;
  upcomingRegCounts: Record<string, number>;
  leaderboard: DashboardLeaderboardEntry[];
  userLeaderboardRank: number | null;
}

export async function fetchDashboardData(
  uid: string,
  chapterId: string
): Promise<DashboardData> {
  const xpCol = collection(db, "users", uid, "xpLog");
  const [questsSnap, completionsSnap, eventCountSnap, eventsSnap] =
    await Promise.all([
      getDocs(collection(db, "quests")),
      getDocs(collection(db, "users", uid, "questCompletions")),
      getCountFromServer(
        query(xpCol, where("source", "==", "event_attendance"))
      ),
      getDocs(collection(db, "events")),
    ]);

  const allQuests = questsSnap.docs.map((d) => d.data() as Quest);

  const completions: Record<string, QuestCompletion> = {};
  completionsSnap.docs.forEach((d) => {
    completions[d.id] = d.data() as QuestCompletion;
  });

  const eventsAttendedCount = eventCountSnap.data().count;

  const eventDocs = eventsSnap.docs
    .map((d) => ({ eventId: d.id, ...d.data() }) as ChapterEventDoc)
    .sort((a, b) => a.date.toMillis() - b.date.toMillis());

  const chapterEvents = eventDocs.filter((e) => e.chapterId === chapterId);
  const now = new Date();

  let pendingReflection: PendingReflection | null = null;
  let bestDeadlineMs = Infinity;

  await Promise.all(
    chapterEvents.map(async (ev) => {
      const regSnap = await getDoc(
        doc(db, "events", ev.eventId, "registrations", uid)
      );
      if (!regSnap.exists()) return;
      const reg = regSnap.data() as RegistrationDoc;
      const deadline = reg.reflectionDeadline;
      if (
        !reg.attended ||
        reg.reflectionSubmitted ||
        !deadline ||
        deadline.toDate() <= now
      )
        return;
      const ms = deadline.toMillis();
      if (ms < bestDeadlineMs) {
        bestDeadlineMs = ms;
        pendingReflection = {
          eventId: ev.eventId,
          eventName: ev.name,
          hoursLeft: hoursUntil(deadline),
        };
      }
    })
  );

  const y = now.getFullYear();
  const m = now.getMonth();
  const eventsThisMonthCount = chapterEvents.filter((e) => {
    const d = e.date.toDate();
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;

  const upcoming = chapterEvents
    .filter((e) => e.date.toDate() > now)
    .slice(0, 5);
  const countEntries = await Promise.all(
    upcoming.map(async (ev) => {
      const snap = await getCountFromServer(
        collection(db, "events", ev.eventId, "registrations")
      );
      return [ev.eventId, snap.data().count] as [string, number];
    })
  );
  const upcomingRegCounts = Object.fromEntries(countEntries) as Record<
    string,
    number
  >;

  const leaderSnap = await getDocs(
    query(
      collection(db, "users"),
      where("chapterId", "==", chapterId),
      where("onboardingComplete", "==", true)
    )
  );
  const sorted = leaderSnap.docs
    .map((d) => ({
      uid: d.id,
      username: d.data().username as string,
      xp: (d.data().xp as number) ?? 0,
      avatarOptions: d.data().avatarOptions as AvatarOptions | undefined,
    }))
    .sort((a, b) => b.xp - a.xp);
  const leaderboard = sorted.slice(0, 5);
  const selfRank = sorted.findIndex((v) => v.uid === uid);
  const userLeaderboardRank = selfRank >= 0 ? selfRank + 1 : null;

  return {
    allQuests,
    completions,
    eventsAttendedCount,
    events: eventDocs,
    pendingReflection,
    eventsThisMonthCount,
    upcomingRegCounts,
    leaderboard,
    userLeaderboardRank,
  };
}

export async function fetchDashboardApprovals(
  chapterId: string
): Promise<number> {
  const usersSnap = await getDocs(
    query(collection(db, "users"), where("chapterId", "==", chapterId))
  );
  let n = 0;
  await Promise.all(
    usersSnap.docs.map(async (userDoc) => {
      const completionsSnap = await getDocs(
        query(
          collection(db, "users", userDoc.id, "questCompletions"),
          where("status", "==", "pending_approval")
        )
      );
      n += completionsSnap.size;
    })
  );
  return n;
}

export async function fetchDashboardActiveVolunteers(
  chapterId: string
): Promise<number> {
  const usersSnap = await getDocs(
    query(collection(db, "users"), where("chapterId", "==", chapterId))
  );
  return usersSnap.docs.filter((d) => d.data()?.onboardingComplete === true)
    .length;
}
