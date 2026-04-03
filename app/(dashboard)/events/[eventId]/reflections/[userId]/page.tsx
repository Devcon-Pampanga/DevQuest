"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const WAVE_COLORS = ["#F5C518", "#F97316", "#22C55E", "#9333EA", "#06B6D4"];

const LIKERT_QUESTIONS = [
  { key: "q1", label: "My Volunteer Role/s and Responsibility/ies were clearly stated",                               section: "Pre-event" },
  { key: "q2", label: "Reporting instructions were clearly stated",                                                    section: "Pre-event" },
  { key: "q3", label: "Reporting instructions were complete (what to wear, time, location, access to location)",      section: "Pre-event" },
  { key: "q4", label: "I received enough materials, time, and support to adequately prepare for my role",             section: "Pre-event" },
  { key: "q5", label: "I felt overwhelmed",                                                                           section: "During event" },
  { key: "q6", label: "I felt my work was essential for the success of the event",                                    section: "During event" },
  { key: "q7", label: "I was given enough time to do tasks assigned to me",                                           section: "During event" },
  { key: "q8", label: "I had access to help anytime I needed it to complete the tasks associated with my role",       section: "During event" },
];

function buildAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundColor=5e35b1&backgroundType=solid&eyes=round&mouth=smile01`;
}

export default function VolunteerReflectionPage() {
  const router   = useRouter();
  const params   = useParams();
  const eventId  = params.eventId  as string;
  const userId   = params.userId   as string;

  const [loading,    setLoading]    = useState(true);
  const [eventName,  setEventName]  = useState("Event");
  const [eventDate,  setEventDate]  = useState("");
  const [username,   setUsername]   = useState("");
  const [reflection, setReflection] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/"); return; }

      // Check coordinator
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists() || userSnap.data().role !== "coordinator") {
        router.replace("/events");
        return;
      }

      try {
        // Load event
        const evSnap = await getDoc(doc(db, "events", eventId));
        if (evSnap.exists()) {
          const evData = evSnap.data();
          setEventName(evData.name ?? "Event");
          if (evData.date?.toDate) {
            setEventDate(evData.date.toDate().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            }));
          }
        }

        // Load volunteer username
        const volSnap = await getDoc(doc(db, "users", userId));
        if (volSnap.exists()) setUsername(volSnap.data().username ?? userId);

        // Load registration / reflection data
        const regSnap = await getDoc(doc(db, "events", eventId, "registrations", userId));
        if (regSnap.exists()) {
          setReflection(regSnap.data().reflectionData ?? null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router, eventId, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex gap-2">
          {WAVE_COLORS.map((color, i) => (
            <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  const d = reflection as {
    firstName?: string; lastName?: string; rolePosition?: string;
    ratings?: Record<string, number>; insights?: string;
    submittedAt?: Timestamp;
  } | null;

  const fullName = d?.firstName ? `${d.firstName} ${d.lastName ?? ""}`.trim() : username;

  const preEvent    = LIKERT_QUESTIONS.filter((q) => q.section === "Pre-event");
  const duringEvent = LIKERT_QUESTIONS.filter((q) => q.section === "During event");

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Link
          href={`/events/${eventId}`}
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <div>
          <h1 className="font-heading text-lg text-text-primary">Volunteer Reflection</h1>
          <p className="text-xs text-text-muted">{eventName}</p>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-6">

        {/* Volunteer identity card */}
        <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
          <img src={buildAvatarUrl(username)} alt="" width={52} height={52} className="rounded-xl border-2 border-border shrink-0" />
          <div className="flex-1">
            <p className="font-heading text-lg text-text-primary">{fullName}</p>
            <p className="text-sm text-text-muted mt-0.5">{d?.rolePosition ?? "—"}</p>
          </div>
          <div className="text-right">
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-semibold">Submitted ✓</span>
            {eventDate && <p className="text-xs text-text-muted mt-1.5">{eventDate}</p>}
          </div>
        </div>

        {!d ? (
          <div className="text-center py-16 text-text-muted text-sm bg-surface border border-border rounded-2xl">
            <div className="text-4xl mb-3">📋</div>
            <p>No reflection data found for this volunteer.</p>
          </div>
        ) : (
          <>
            {/* Basic info */}
            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="font-heading text-xs text-text-muted uppercase tracking-wider">Volunteer Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "First Name",            value: d.firstName   },
                  { label: "Last Name",             value: d.lastName    },
                  { label: "Role & Position",       value: d.rolePosition },
                  { label: "Date of Event",         value: eventDate     },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm text-text-primary bg-white/5 rounded-lg px-3 py-2">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-event ratings */}
            {d.ratings && (
              <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-highlight" />
                  <h2 className="font-heading text-xs text-text-muted uppercase tracking-wider">Pre-event Preparation</h2>
                </div>
                <div className="flex flex-col gap-4">
                  {preEvent.map(({ key, label }) => {
                    const val = d.ratings?.[key];
                    return (
                      <div key={key}>
                        <p className="text-sm text-text-primary mb-2">{label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted w-28 shrink-0">Strongly Disagree</span>
                          <div className="flex gap-2 flex-1 justify-center">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <div key={n} className="flex flex-col items-center gap-1">
                                <span className="text-xs text-text-muted">{n}</span>
                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                                  val === n
                                    ? "border-accent-highlight bg-accent-highlight text-white"
                                    : "border-border text-text-muted"
                                }`}>
                                  {val === n ? "✓" : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-text-muted w-28 shrink-0 text-right">Strongly Agree</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* During event ratings */}
            {d.ratings && (
              <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h2 className="font-heading text-xs text-text-muted uppercase tracking-wider">During the Event</h2>
                </div>
                <div className="flex flex-col gap-4">
                  {duringEvent.map(({ key, label }) => {
                    const val = d.ratings?.[key];
                    const isReversed = key === "q5"; // "felt overwhelmed" is reversed
                    return (
                      <div key={key}>
                        <p className="text-sm text-text-primary mb-2">{label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted w-28 shrink-0">{isReversed ? "Strongly Agree" : "Strongly Disagree"}</span>
                          <div className="flex gap-2 flex-1 justify-center">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <div key={n} className="flex flex-col items-center gap-1">
                                <span className="text-xs text-text-muted">{n}</span>
                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                                  val === n
                                    ? "border-cyan-400 bg-cyan-400 text-white"
                                    : "border-border text-text-muted"
                                }`}>
                                  {val === n ? "✓" : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-text-muted w-28 shrink-0 text-right">{isReversed ? "Strongly Disagree" : "Strongly Agree"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Insights */}
            {d.insights && (
              <div className="bg-surface border border-border rounded-2xl p-5">
                <h2 className="font-heading text-xs text-text-muted uppercase tracking-wider mb-3">Insights & Suggestions</h2>
                <p className="text-sm text-text-primary leading-relaxed">{d.insights}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}