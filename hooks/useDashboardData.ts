"use client";

import { useState, useEffect, useCallback } from "react";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChapterSessionUser } from "@/types/chapter";
import type { ChapterEventDoc } from "@/types/chapter";
import type { Quest, QuestCompletion } from "@/types/quest";
import type { PendingReflection, DashboardLeaderboardEntry } from "@/types/dashboard";
import type { AvatarOptions } from "@/lib/avatar";

function hoursUntil(ts: Timestamp): number {
  return Math.max(0, Math.floor((ts.toDate().getTime() - Date.now()) / 3600000));
}

interface RegistrationDoc {
  attended: boolean;
  reflectionSubmitted: boolean;
  reflectionDeadline?: Timestamp;
}

export function useDashboardData(currentUser: ChapterSessionUser | null, authChecked: boolean) {
  const firebaseUid = currentUser?.uid ?? "";

  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<Record<string, QuestCompletion>>({});
  const [eventsAttendedCount, setEventsAttendedCount] = useState(0);
  const [events, setEvents] = useState<ChapterEventDoc[]>([]);
  const [pendingReflection, setPendingReflection] = useState<PendingReflection | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [approvalsCount, setApprovalsCount] = useState(0);
  const [chapterVolunteersActive, setChapterVolunteersActive] = useState<number | null>(null);
  const [eventsThisMonthCount, setEventsThisMonthCount] = useState(0);

  const [upcomingRegCounts, setUpcomingRegCounts] = useState<Record<string, number>>({});

  const [leaderboard, setLeaderboard] = useState<DashboardLeaderboardEntry[]>([]);
  const [userLeaderboardRank, setUserLeaderboardRank] = useState<number | null>(null);

  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    if (!authChecked || !currentUser) return;
    const chapterId = currentUser.chapterId;

    async function load() {
      setDashboardLoading(true);
      try {
        const xpCol = collection(db, "users", firebaseUid, "xpLog");
        const [questsSnap, completionsSnap, eventCountSnap, eventsSnap] = await Promise.all([
          getDocs(collection(db, "quests")),
          getDocs(collection(db, "users", firebaseUid, "questCompletions")),
          getCountFromServer(query(xpCol, where("source", "==", "event_attendance"))),
          getDocs(collection(db, "events")),
        ]);

        setAllQuests(questsSnap.docs.map((d) => d.data() as Quest));
        const map: Record<string, QuestCompletion> = {};
        completionsSnap.docs.forEach((d) => {
          map[d.id] = d.data() as QuestCompletion;
        });
        setCompletions(map);
        setEventsAttendedCount(eventCountSnap.data().count);

        const eventDocs = eventsSnap.docs
          .map((d) => ({ eventId: d.id, ...d.data() }) as ChapterEventDoc)
          .sort((a, b) => a.date.toMillis() - b.date.toMillis());
        setEvents(eventDocs);

        const chapterEvents = eventDocs.filter((e) => e.chapterId === chapterId);
        const now = new Date();
        let best: PendingReflection | null = null;
        let bestDeadlineMs = Infinity;

        await Promise.all(
          chapterEvents.map(async (ev) => {
            const regSnap = await getDoc(doc(db, "events", ev.eventId, "registrations", firebaseUid));
            if (!regSnap.exists()) return;
            const reg = regSnap.data() as RegistrationDoc;
            const deadline = reg.reflectionDeadline;
            if (
              !reg.attended ||
              reg.reflectionSubmitted ||
              !deadline ||
              deadline.toDate() <= now
            ) {
              return;
            }
            const ms = deadline.toMillis();
            if (ms < bestDeadlineMs) {
              bestDeadlineMs = ms;
              best = {
                eventId: ev.eventId,
                eventName: ev.name,
                hoursLeft: hoursUntil(deadline),
              };
            }
          })
        );
        setPendingReflection(best);

        const y = now.getFullYear();
        const m = now.getMonth();
        const thisMonth = chapterEvents.filter((e) => {
          const d = e.date.toDate();
          return d.getFullYear() === y && d.getMonth() === m;
        }).length;
        setEventsThisMonthCount(thisMonth);

        const upcoming = chapterEvents
          .filter((e) => e.date.toDate() > now)
          .slice(0, 5);
        const countEntries = await Promise.all(
          upcoming.map(async (ev) => {
            const snap = await getCountFromServer(collection(db, "events", ev.eventId, "registrations"));
            return [ev.eventId, snap.data().count] as [string, number];
          })
        );
        setUpcomingRegCounts(Object.fromEntries(countEntries));

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
        setLeaderboard(sorted.slice(0, 5));
        const selfRank = sorted.findIndex((v) => v.uid === firebaseUid);
        setUserLeaderboardRank(selfRank >= 0 ? selfRank + 1 : null);
      } finally {
        setDashboardLoading(false);
      }
    }

    void load();
  }, [authChecked, currentUser, firebaseUid]);

  const loadApprovalsCount = useCallback(async () => {
    if (!currentUser || currentUser.role !== "coordinator") return;
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("chapterId", "==", currentUser.chapterId))
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
      setApprovalsCount(n);
    } catch {
      setApprovalsCount(0);
    }
  }, [currentUser]);

  useEffect(() => {
    void loadApprovalsCount();
  }, [loadApprovalsCount]);

  const loadChapterVolunteers = useCallback(async () => {
    if (!currentUser || currentUser.role !== "coordinator") return;
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("chapterId", "==", currentUser.chapterId))
      );
      const active = usersSnap.docs.filter((d) => d.data()?.onboardingComplete === true).length;
      setChapterVolunteersActive(active);
    } catch {
      setChapterVolunteersActive(null);
    }
  }, [currentUser]);

  useEffect(() => {
    void loadChapterVolunteers();
  }, [loadChapterVolunteers]);

  useEffect(() => {
    if (dashboardLoading) {
      setBarsReady(false);
      return;
    }
    const t = setTimeout(() => setBarsReady(true), 350);
    return () => clearTimeout(t);
  }, [dashboardLoading]);

  return {
    allQuests,
    completions,
    eventsAttendedCount,
    events,
    pendingReflection,
    dashboardLoading,
    approvalsCount,
    chapterVolunteersActive,
    eventsThisMonthCount,
    upcomingRegCounts,
    leaderboard,
    userLeaderboardRank,
    barsReady,
  };
}
