"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { useAuth } from "@/context/AuthContext";
import type { EventDoc, EventRegistration, ReflectionRatingKey, ReflectionMood } from "@/lib/events/types";
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
        <span className="text-xs text-text-muted w-24 text-right shrink-0">{leftLabel}</span>
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
        <span className="text-xs text-text-muted w-24 shrink-0">{rightLabel}</span>
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReflectPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const { ready } = useRequireDashboardAuth();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDoc | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [done, setDone] = useState(false);

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

      if (reg.reflectionSubmitted) { setAlreadySubmitted(true); setDone(true); setAuthReady(true); return; }
      if (!reg.attended) { router.replace(`/events/${eventId}`); return; }
      if (reg.reflectionDeadline && new Date() > reg.reflectionDeadline.toDate()) {
        router.replace(`/events/${eventId}`); return;
      }
      if (reg.role) setRolePosition(reg.role);

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

      router.replace(`/events/${eventId}?reflected=1`);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex gap-2">
          {WAVE_COLORS.map((color, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const avatarUrl = buildAvatarUrl(user!.username, user!.avatarOptions ?? DEFAULT_AVATAR);

  // ── Already submitted ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col min-h-screen">
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
        <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
          <div className="text-6xl mb-5">🎉</div>
          <h2 className="font-heading text-2xl text-text-primary mb-2">
            {alreadySubmitted ? "Already Submitted!" : "Reflection Submitted!"}
          </h2>
          <div className="text-3xl font-bold text-yellow-400 mb-4 font-mono">+25 XP</div>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-8">
            Your reflection for <strong className="text-text-primary">{event?.name}</strong> has been recorded.
          </p>
          <Link
            href={`/events/${eventId}`}
            className="px-6 py-3 bg-accent-highlight hover:bg-accent-primary rounded-xl text-white font-heading font-medium transition-colors"
          >
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
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
          <div className="grid grid-cols-4 gap-3">
            {(
              [
                { key: "drained" as ReflectionMood, emoji: "🥱", label: "Drained" },
                { key: "okay" as ReflectionMood, emoji: "🙂", label: "Okay" },
                { key: "good" as ReflectionMood, emoji: "😊", label: "Good" },
                { key: "energized" as ReflectionMood, emoji: "🔥", label: "Energized" },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMood(m.key)}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border text-xs font-heading font-semibold uppercase tracking-wide transition-all ${
                  mood === m.key
                    ? "border-accent-highlight bg-accent-highlight/10 text-accent-highlight scale-[1.02]"
                    : "border-border bg-white/5 text-text-muted hover:border-accent-primary/50 hover:text-text-secondary"
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-heading font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent-primary/20"
        >
          {submitting ? (
            <span className="flex gap-1.5">
              {WAVE_COLORS.map((color, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </span>
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
