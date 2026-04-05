"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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

interface CoAttendee {
  userId: string;
  username: string;
  role: string;
  avatarOptions?: AvatarOptions;
}
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";

const WAVE_COLORS = ["#F5C518", "#F97316", "#22C55E", "#9333EA", "#06B6D4"];

const TEAM_LABELS: Record<string, string> = {
  lead_learners: "Lead Learners",
  people_culture: "People & Culture",
  community_engagement: "Community Engagement",
  creatives: "Creatives",
  sustainability: "Sustainability",
};

// ─── Likert scale component ────────────────────────────────────────────────────

function LikertScale({
  label,
  required,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  leftLabel: string;
  rightLabel: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-sm font-heading text-text-primary mb-4">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </p>
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="text-xs text-text-muted w-14 leading-tight text-right shrink-0">{leftLabel}</span>
        <div className="flex items-center gap-3 flex-1 justify-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="flex flex-col items-center gap-1 group"
            >
              <span className="text-xs text-text-muted">{n}</span>
              <div
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  value === n
                    ? "border-accent-highlight bg-accent-highlight"
                    : "border-border bg-surface group-hover:border-accent-primary"
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted w-14 leading-tight shrink-0">{rightLabel}</span>
      </div>
    </div>
  );
}

// ─── Auto-filled field display ─────────────────────────────────────────────────

function AutoFilledField({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        {label} <span className="text-red-400">*</span>
      </label>
      {value ? (
        <div className="flex items-center gap-2 px-4 py-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-sm text-text-primary flex-1">{value}</span>
          <span className="text-xs text-accent-highlight font-medium">Auto-filled</span>
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onEdit(e.target.value)}
          placeholder="Your answer"
          className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary transition-shadow"
        />
      )}
    </div>
  );
}

// ─── Reflection success overlay (mobile-only) ─────────────────────────────────

function ReflectionSuccessOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base"
      style={{ animation: "successFadeIn 0.35s ease-out forwards" }}
    >
      <style>{`
        @keyframes successFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes circleDraw {
          from { stroke-dashoffset: 166; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 48; }
          to   { stroke-dashoffset: 0; }
        }
        .draw-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: circleDraw 0.55s ease-out 0.15s forwards;
        }
        .draw-check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: checkDraw 0.3s ease-out 0.65s forwards;
        }
      `}</style>

      <svg viewBox="0 0 52 52" className="w-20 h-20 mb-8" style={{ overflow: "visible" }}>
        <circle
          cx="26" cy="26" r="25"
          fill="none" stroke="#A855F7" strokeWidth="1.5"
          className="draw-circle"
        />
        <path
          fill="none" stroke="#A855F7" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          d="M14 27l8 8 16-16"
          className="draw-check"
        />
      </svg>

      <h2 className="font-heading text-3xl text-text-primary mb-3 tracking-wide">Reflection submitted.</h2>
      <p className="text-text-secondary text-sm text-center max-w-xs leading-relaxed">+25 XP earned</p>
      <p className="text-text-muted text-xs mt-10">Taking you back to the event…</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReflectPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const { ready } = useRequireDashboardAuth();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDoc | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Auto-filled fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rolePosition, setRolePosition] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Likert ratings
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

  // Star-giving state
  const [coAttendees, setCoAttendees] = useState<CoAttendee[]>([]);
  const [starBudget, setStarBudget] = useState(1);
  const [starsGiven, setStarsGiven] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!ready || !user) return;

    async function load() {
      const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");

      // User profile → prefill name
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

      // Event → prefill date + chapter
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

      // Registration → guards + role override
      const regSnap = await getDoc(doc(db, "events", eventId, "registrations", user!.uid));
      if (!regSnap.exists()) { router.replace(`/events/${eventId}`); return; }
      const reg = regSnap.data() as EventRegistration;

      if (reg.reflectionSubmitted) { setAuthReady(true); setShowSuccessOverlay(true); setTimeout(() => router.replace(`/events/${eventId}`), 2400); return; }
      if (!reg.attended) { router.replace(`/events/${eventId}`); return; }
      if (reg.reflectionDeadline && new Date() > reg.reflectionDeadline.toDate()) {
        router.replace(`/events/${eventId}`); return;
      }
      if (reg.role) setRolePosition(reg.role);

      // Load co-attendees for star-giving
      const allRegsSnap = await getDocs(collection(db, "events", eventId, "registrations"));
      const attendedDocs = allRegsSnap.docs.filter((d) => {
        const r = d.data() as EventRegistration;
        return r.attended && d.id !== user!.uid;
      });

      // Fetch user docs for all co-attendees to get accurate username + avatarOptions
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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function handleSubmit() {
    if (!user || !event) return;

    if (!chapterId)           return showToast("Chapter not found. Please try again.");
    if (!firstName.trim())    return showToast("First name not found. Please check your account.");
    if (!rolePosition.trim()) return showToast("Role not found. Please register for this event first.");
    if (!q1) return showToast("Please rate: My volunteer roles were clearly stated.");
    if (!q2) return showToast("Please rate: Reporting instructions were clearly stated.");
    if (!q3) return showToast("Please rate: Reporting instructions were complete.");
    if (!q4) return showToast("Please rate: I received enough materials and support.");
    if (!q5) return showToast("Please rate: I felt overwhelmed.");
    if (!q6) return showToast("Please rate: My work was essential to the event.");
    if (!q7) return showToast("Please rate: I was given enough time for tasks.");
    if (!q8) return showToast("Please rate: I had access to help.");
    if (!insights.trim()) return showToast("Please share your insights.");
    if (!mood)             return showToast("Please select how you're feeling after the event.");

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
      showToast(`Failed to submit: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!ready || !authReady) {
    return (
      <div className="flex flex-col min-h-screen animate-pulse">
        {/* Top bar skeleton */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a1a2e]" />
            <div className="w-40 h-5 rounded-full bg-[#1a1a2e]" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#1a1a2e]" />
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-6">
          {/* Header card */}
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3">
            <div className="w-48 h-5 rounded-full bg-[#1a1a2e]" />
            <div className="w-full h-3 rounded-full bg-[#1a1a2e]" />
            <div className="w-3/4 h-3 rounded-full bg-[#1a1a2e]" />
          </div>
          {/* XP strip */}
          <div className="h-12 rounded-xl bg-[#1a1a2e]" />
          {/* Form section cards */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
              <div className="w-32 h-4 rounded-full bg-[#1a1a2e]" />
              <div className="w-full h-3 rounded-full bg-[#1a1a2e]" />
              <div className="w-5/6 h-3 rounded-full bg-[#1a1a2e]" />
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex-1 h-10 rounded-lg bg-[#1a1a2e]" />
                ))}
              </div>
            </div>
          ))}
          {/* Submit button */}
          <div className="w-full h-14 rounded-xl bg-[#1a1a2e]" />
        </div>
      </div>
    );
  }

  const avatarUrl = buildAvatarUrl(user!.username, user!.avatarOptions ?? DEFAULT_AVATAR);

  // ── Form ─────────────────────────────────────────────────────────────────────
  if (showSuccessOverlay) return <ReflectionSuccessOverlay />;

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/events/${eventId}`} className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <h1 className="font-heading text-xl text-text-primary tracking-wide truncate min-w-0">Post-Event Reflection</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="Profile" width={36} height={36} className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors" />
          </Link>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-6">

        {/* Header card */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h1 className="font-heading text-xl text-text-primary mb-2">Volunteer Feedback and Reflection</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Please take time today to answer this quick survey for us to better understand your volunteer experience.
          </p>
          <p className="text-xs text-red-400 mt-3">* Indicates required question</p>
        </div>

        {/* XP strip */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-500/25 bg-yellow-500/5">
          <span className="text-xl">⚡</span>
          <div>
            <span className="text-sm font-bold text-yellow-400">+25 XP awarded on submission</span>
            <p className="text-xs text-text-muted mt-0.5">Complete all fields below to claim your reward.</p>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
          {/* Chapter */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              From what DEVCON Kids chapter is hosting this event? <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2 px-4 py-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-sm text-text-primary flex-1">{chapterId || "—"}</span>
              <span className="text-xs text-accent-highlight font-medium">Auto-filled</span>
            </div>
          </div>

          <AutoFilledField label="First Name" value={firstName} onEdit={setFirstName} />
          <AutoFilledField label="Last Name" value={lastName} onEdit={setLastName} />
          <AutoFilledField label="Roles and Position assigned" value={rolePosition} onEdit={setRolePosition} />

          {/* Date of Event */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Date of Event <span className="text-red-400">*</span>
            </label>
            <div className="px-4 py-3 bg-white/5 border border-border rounded-lg text-sm text-text-primary">
              {eventDate || "—"}
            </div>
          </div>
        </div>

        {/* Pre-event section header */}
        <div className="bg-accent-highlight/10 border border-accent-highlight/30 rounded-xl px-5 py-3">
          <h2 className="font-heading text-sm font-bold text-accent-highlight uppercase tracking-wider">Pre-event preparation</h2>
          <p className="text-xs text-text-muted mt-1">Rate your experience BEFORE the event:</p>
        </div>

        <LikertScale
          label="My Volunteer Role/s and Responsibility/ies were clearly stated"
          required leftLabel="Strongly Disagree" rightLabel="Strongly Agree"
          value={q1} onChange={setQ1}
        />
        <LikertScale
          label="Reporting instructions were clearly stated"
          required leftLabel="Strongly Disagree" rightLabel="Strongly Agree"
          value={q2} onChange={setQ2}
        />
        <LikertScale
          label="Reporting instructions were complete (what to wear, time, location, access to location)"
          required leftLabel="Strongly Disagree" rightLabel="Strongly Agree"
          value={q3} onChange={setQ3}
        />
        <LikertScale
          label="I received enough materials, time, and support (ie practice time) to adequately prepare for my role"
          required leftLabel="Strongly Disagree" rightLabel="Strongly Agree"
          value={q4} onChange={setQ4}
        />

        {/* During event section header */}
        <div className="bg-accent-highlight/10 border border-accent-highlight/30 rounded-xl px-5 py-3">
          <h2 className="font-heading text-sm font-bold text-accent-highlight uppercase tracking-wider">During the event</h2>
          <p className="text-xs text-text-muted mt-1">Rate your experience DURING the event:</p>
        </div>

        <LikertScale
          label="I felt overwhelmed"
          required leftLabel="Strongly Agree" rightLabel="Strongly Disagree"
          value={q5} onChange={setQ5}
        />
        <LikertScale
          label="I felt my work was essential for the success of the event"
          required leftLabel="Strongly Disagree" rightLabel="Strongly Agree"
          value={q6} onChange={setQ6}
        />
        <LikertScale
          label="I was given enough time to do tasks assigned to me"
          required leftLabel="Strongly Disagree" rightLabel="Strongly Agree"
          value={q7} onChange={setQ7}
        />
        <LikertScale
          label="I had access to help anytime I needed it to complete the tasks associated with my role"
          required leftLabel="Disagree" rightLabel="Agree"
          value={q8} onChange={setQ8}
        />

        {/* Insights */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <label className="block text-sm font-heading text-text-primary mb-3">
            Share insights, suggestions about your personal experience in being part of the team.
            <span className="text-red-400 ml-1">*</span>
          </label>
          <textarea
            rows={4}
            value={insights}
            onChange={(e) => setInsights(e.target.value)}
            placeholder="Your answer"
            className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none transition-shadow"
          />
        </div>

        {/* Mood */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <label className="block text-sm font-heading text-text-primary mb-4">
            How are you feeling after today&apos;s event?
            <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                { key: "drained" as ReflectionMood, emoji: "🥱", label: "Drained", color: "#EF4444" },
                { key: "okay" as ReflectionMood, emoji: "🙂", label: "Okay", color: "#A1A1AA" },
                { key: "good" as ReflectionMood, emoji: "😊", label: "Good", color: "#22C55E" },
                { key: "energized" as ReflectionMood, emoji: "🔥", label: "Energized", color: "#F97316" },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMood(m.key)}
                className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl border text-xs font-heading font-semibold uppercase tracking-wide transition-all"
                style={
                  mood === m.key
                    ? { borderColor: m.color, backgroundColor: `${m.color}18`, color: m.color, transform: "scale(1.02)" }
                    : { borderColor: "#27272A", backgroundColor: "rgba(255,255,255,0.03)", color: "#71717A" }
                }
              >
                <span className="text-3xl">{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Star giving */}
        {coAttendees.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-heading text-text-primary">
                Who made it better? ⭐
              </label>
              <span className={`text-xs font-medium tabular-nums px-2 py-0.5 rounded-full ${starsGiven.size >= starBudget ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" : "bg-white/5 text-text-muted"}`}>
                {starBudget - starsGiven.size} / {starBudget} left
              </span>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Give a star to a fellow volunteer who stood out. You have {starBudget} star{starBudget !== 1 ? "s" : ""} to give.
            </p>
            <div className="flex flex-col gap-2">
              {coAttendees.map((person) => {
                const isStarred = starsGiven.has(person.userId);
                const budgetFull = starsGiven.size >= starBudget;
                const disabled = !isStarred && budgetFull;
                return (
                  <button
                    key={person.userId}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setStarsGiven((prev) => {
                        const next = new Set(prev);
                        if (next.has(person.userId)) next.delete(person.userId);
                        else if (next.size < starBudget) next.add(person.userId);
                        return next;
                      });
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                      isStarred
                        ? "border-yellow-500/60 bg-yellow-500/10 ring-1 ring-yellow-500/30"
                        : disabled
                        ? "border-border bg-white/2 opacity-40 cursor-not-allowed"
                        : "border-border bg-white/5 hover:border-accent-primary/50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={buildAvatarUrl(person.username, person.avatarOptions ?? DEFAULT_AVATAR)}
                      alt=""
                      width={32}
                      height={32}
                      className={`rounded-lg border shrink-0 ${isStarred ? "border-yellow-500/50" : "border-border"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{person.username}</p>
                      <p className="text-xs text-text-muted truncate">{person.role}</p>
                    </div>
                    <span className={`text-lg shrink-0 transition-transform ${isStarred ? "scale-125" : "opacity-30"}`}>
                      {isStarred ? "⭐" : "☆"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-heading font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent-primary/20"
        >
          {submitting ? (
            <span className="w-36 h-4 rounded-full bg-white/30 animate-pulse" />
          ) : (
            <>SUBMIT REFLECTION →</>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-elevated border border-red-500/30 border-l-4 border-l-red-500 rounded-xl text-sm text-text-primary shadow-xl max-w-xs">
          {toast}
        </div>
      )}
    </div>
  );
}
