"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { useAuth } from "@/context/AuthContext";
import type { EventDoc, EventRegistration, ReflectionRatingKey, ReflectionMood } from "@/lib/events/types";
import type { AvatarOptions } from "@/lib/avatar";

export interface CoAttendee {
  userId: string;
  username: string;
  role: string;
  avatarOptions?: AvatarOptions;
}

const TEAM_LABELS: Record<string, string> = {
  lead_learners: "Lead Learners",
  people_culture: "People & Culture",
  community_engagement: "Community Engagement",
  creatives: "Creatives",
  sustainability: "Sustainability",
};

export function useReflectionForm(eventId: string) {
  const router = useRouter();
  const { ready } = useRequireDashboardAuth();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDoc | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rolePosition, setRolePosition] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [eventDate, setEventDate] = useState("");

  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [q3, setQ3] = useState<number | null>(null);
  const [q4, setQ4] = useState<number | null>(null);
  const [q5, setQ5] = useState<number | null>(null);
  const [q6, setQ6] = useState<number | null>(null);
  const [q7, setQ7] = useState<number | null>(null);
  const [q8, setQ8] = useState<number | null>(null);

  const [insights, setInsights] = useState("");
  const [mood, setMood] = useState<ReflectionMood | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const [coAttendees, setCoAttendees] = useState<CoAttendee[]>([]);
  const [starBudget, setStarBudget] = useState(1);
  const [starsGiven, setStarsGiven] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!ready || !user) return;

    async function load() {
      const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");

      const userSnap = await getDoc(doc(db, "users", user!.uid));
      if (userSnap.exists()) {
        const u = userSnap.data();
        if (u.firstName) {
          setFirstName(cap(u.firstName));
          setLastName(cap(u.lastName ?? ""));
        } else if (u.username) {
          const parts = (u.username as string).trim().split(" ");
          setFirstName(cap(parts[0] ?? ""));
          setLastName(parts.slice(1).map(cap).join(" "));
        }
        if (u.teams && Array.isArray(u.teams) && u.teams.length > 0) {
          setRolePosition((u.teams as string[]).map((t) => TEAM_LABELS[t] ?? t).join(", "));
        }
      }

      const evSnap = await getDoc(doc(db, "events", eventId));
      if (!evSnap.exists()) { router.replace("/events"); return; }
      const evData = evSnap.data();
      setEvent({ eventId, ...evData } as EventDoc);
      if (evData.chapterId) setChapterId(evData.chapterId);
      if (evData.date?.toDate) {
        setEventDate(
          evData.date.toDate().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })
        );
      }

      const regSnap = await getDoc(doc(db, "events", eventId, "registrations", user!.uid));
      if (!regSnap.exists()) { router.replace(`/events/${eventId}`); return; }
      const reg = regSnap.data() as EventRegistration;

      if (reg.reflectionSubmitted) {
        setAuthReady(true);
        setShowSuccessOverlay(true);
        setTimeout(() => router.replace(`/events/${eventId}`), 2400);
        return;
      }
      if (!reg.attended) { router.replace(`/events/${eventId}`); return; }
      if (reg.reflectionDeadline && new Date() > reg.reflectionDeadline.toDate()) {
        router.replace(`/events/${eventId}`); return;
      }
      if (reg.role) setRolePosition(reg.role);

      const allRegsSnap = await getDocs(collection(db, "events", eventId, "registrations"));
      const attendedDocs = allRegsSnap.docs.filter((d) => {
        const r = d.data() as EventRegistration;
        return r.attended && d.id !== user!.uid;
      });

      const userDocMap: Record<string, { username: string; avatarOptions?: AvatarOptions }> = {};
      await Promise.all(
        attendedDocs.map(async (d) => {
          const uSnap = await getDoc(doc(db, "users", d.id));
          if (uSnap.exists()) {
            const uData = uSnap.data();
            userDocMap[d.id] = {
              username: typeof uData.username === "string" ? uData.username : d.id,
              avatarOptions: uData.avatarOptions as AvatarOptions | undefined,
            };
          }
        })
      );

      const others: CoAttendee[] = attendedDocs.map((d) => {
        const r = d.data() as EventRegistration;
        const fromUser = userDocMap[d.id];
        return {
          userId: d.id,
          username: fromUser?.username ?? r.username ?? d.id,
          role: r.role,
          avatarOptions: fromUser?.avatarOptions ?? r.avatarOptions,
        };
      });
      setCoAttendees(others);
      setStarBudget(Math.min(3, Math.max(1, Math.floor(others.length / 4))));

      setAuthReady(true);
    }

    load();
  }, [ready, user, eventId, router]);

  function showToastMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function handleSubmit() {
    if (!user || !event) return;

    if (!chapterId)           return showToastMsg("Chapter not found. Please try again.");
    if (!firstName.trim())    return showToastMsg("First name not found. Please check your account.");
    if (!rolePosition.trim()) return showToastMsg("Role not found. Please register for this event first.");
    if (!q1) return showToastMsg("Please rate: My volunteer roles were clearly stated.");
    if (!q2) return showToastMsg("Please rate: Reporting instructions were clearly stated.");
    if (!q3) return showToastMsg("Please rate: Reporting instructions were complete.");
    if (!q4) return showToastMsg("Please rate: I received enough materials and support.");
    if (!q5) return showToastMsg("Please rate: I felt overwhelmed.");
    if (!q6) return showToastMsg("Please rate: My work was essential to the event.");
    if (!q7) return showToastMsg("Please rate: I was given enough time for tasks.");
    if (!q8) return showToastMsg("Please rate: I had access to help.");
    if (!insights.trim()) return showToastMsg("Please share your insights.");
    if (!mood)             return showToastMsg("Please select how you're feeling after the event.");

    setSubmitting(true);
    try {
      const ratings: Record<ReflectionRatingKey, number> = { q1, q2, q3, q4, q5, q6, q7, q8 } as Record<ReflectionRatingKey, number>;

      await setDoc(
        doc(db, "events", eventId, "registrations", user.uid),
        {
          userId: user.uid,
          reflectionSubmitted: true,
          starsGiven: Array.from(starsGiven),
          reflectionData: {
            firstName,
            lastName,
            rolePosition,
            chapterId,
            ratings,
            mood,
            insights: insights.trim(),
            submittedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      await updateDoc(doc(db, "users", user.uid), { xp: increment(25) });

      await addDoc(collection(db, "users", user.uid, "xpLog"), {
        source: "reflection",
        sourceId: eventId,
        description: `Post-event reflection for ${event.name}`,
        xp: 25,
        createdAt: serverTimestamp(),
      });

      if (starsGiven.size > 0) {
        const batch = writeBatch(db);
        Array.from(starsGiven).forEach((starredUid) => {
          batch.update(doc(db, "users", starredUid), { starsReceived: increment(1) });
        });
        await batch.commit();
      }

      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setShowSuccessOverlay(true);
        setTimeout(() => router.replace(`/events/${eventId}?reflected=1`), 2400);
      } else {
        router.replace(`/events/${eventId}?reflected=1`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToastMsg(`Failed to submit: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    ready,
    user,
    event,
    authReady,
    showSuccessOverlay,
    firstName, setFirstName,
    lastName, setLastName,
    rolePosition, setRolePosition,
    chapterId,
    eventDate,
    q1, setQ1,
    q2, setQ2,
    q3, setQ3,
    q4, setQ4,
    q5, setQ5,
    q6, setQ6,
    q7, setQ7,
    q8, setQ8,
    insights, setInsights,
    mood, setMood,
    submitting,
    toast,
    coAttendees,
    starBudget,
    starsGiven,
    setStarsGiven,
    handleSubmit,
  };
}
