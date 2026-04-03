"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, increment, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const WAVE_COLORS = ["#F5C518", "#F97316", "#22C55E", "#9333EA", "#06B6D4"];

// ─── Likert scale component ───────────────────────────────────────────────────

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
        {label}{required && <span className="text-red-400 ml-1">*</span>}
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
              <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                value === n
                  ? "border-accent-highlight bg-accent-highlight"
                  : "border-border bg-surface group-hover:border-accent-primary"
              }`} />
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted w-24 shrink-0">{rightLabel}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReflectionPage() {
  const router  = useRouter();
  const params  = useParams();
  const eventId = params.eventId as string;

  const [userId,    setUserId]    = useState<string | null>(null);
  const [eventName, setEventName] = useState("Event");
  const [eventDate, setEventDate] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // ── Form fields ──────────────────────────────────────────────────────────────
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [rolePosition, setRolePosition] = useState("");
  const [chapter,      setChapter]      = useState("");

  // Likert ratings (1–5, null = not answered)
  const [q1, setQ1] = useState<number | null>(null); // roles clearly stated
  const [q2, setQ2] = useState<number | null>(null); // reporting instructions clearly stated
  const [q3, setQ3] = useState<number | null>(null); // reporting instructions complete
  const [q4, setQ4] = useState<number | null>(null); // received enough materials/support
  const [q5, setQ5] = useState<number | null>(null); // felt overwhelmed
  const [q6, setQ6] = useState<number | null>(null); // work essential to event success
  const [q7, setQ7] = useState<number | null>(null); // given enough time for tasks
  const [q8, setQ8] = useState<number | null>(null); // had access to help

  const [insights,   setInsights]   = useState("");
  const [mood,       setMood]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [toast,      setToast]      = useState("");

  // ── Auth + preflight ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/"); return; }
      setUserId(user.uid);

      // 1. User profile → prefill name + teams as role
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const u = userSnap.data();

          // Name: capitalize first letter of each word
          const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
          const capWords = (s: string) => s.split(" ").map(cap).join(" ");

          if (u.firstName) {
            setFirstName(capWords(u.firstName));
            setLastName(capWords(u.lastName ?? ""));
          } else if (u.username) {
            const parts = (u.username as string).trim().split(" ");
            setFirstName(cap(parts[0] ?? ""));
            setLastName(capWords(parts.slice(1).join(" ") ?? ""));
          }

          // Role/Position: map team IDs to human-readable labels using TEAM_META
          // e.g. ["lead_learners", "people_culture"] → "Lead Learners, People & Culture"
          const TEAM_META_LABELS: Record<string, string> = {
            lead_learners:        "Lead Learners",
            people_culture:       "People & Culture",
            community_engagement: "Community Engagement",
            creatives:            "Creatives",
            sustainability:       "Sustainability",
            tech:                 "Tech",
            logistics:            "Logistics",
            finance:              "Finance",
            marketing:            "Marketing",
            documentation:        "Documentation",
          };

          if (u.teams && Array.isArray(u.teams) && u.teams.length > 0) {
            const labels = (u.teams as string[])
              .map((tid) => TEAM_META_LABELS[tid] ?? tid)
              .join(", ");
            setRolePosition(labels);
          }
        }
      } catch { /* ok */ }

      // 2. Event → prefill name, date, chapter (event chapter overrides)
      try {
        const evSnap = await getDoc(doc(db, "events", eventId));
        if (evSnap.exists()) {
          const data = evSnap.data();
          setEventName(data.name ?? "Event");
          if (data.chapterId) setChapterId(data.chapterId);
          if (data.date?.toDate) {
            setEventDate(data.date.toDate().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            }));
          }
        }
      } catch { /* ok */ }

      // 3. Registration → event role overrides profile teams if they registered
      try {
        const regSnap = await getDoc(doc(db, "events", eventId, "registrations", user.uid));
        if (regSnap.exists()) {
          const reg = regSnap.data();
          if (reg.reflectionSubmitted) { setAlreadySubmitted(true); setDone(true); }
          // Event-specific role takes priority over profile teams
          if (reg.role) setRolePosition(reg.role);
        }
      } catch { /* ok */ }

      setAuthReady(true);
    });
    return () => unsub();
  }, [router, eventId]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!chapterId)           return showToast("Chapter not found. Please try again.");
    if (!firstName.trim())    return showToast("First name not found. Please check your account.");
    if (!lastName.trim())     return showToast("Last name not found. Please check your account.");
    if (!rolePosition.trim()) return showToast("Role not found. Please register for this event first.");
    if (!q1) return showToast("Please rate: Volunteer roles were clearly stated.");
    if (!q2) return showToast("Please rate: Reporting instructions were clearly stated.");
    if (!q3) return showToast("Please rate: Reporting instructions were complete.");
    if (!q4) return showToast("Please rate: Received enough materials and support.");
    if (!q5) return showToast("Please rate: I felt overwhelmed.");
    if (!q6) return showToast("Please rate: My work was essential to the event.");
    if (!q7) return showToast("Please rate: Given enough time for tasks.");
    if (!q8) return showToast("Please rate: Had access to help.");
    if (!insights.trim()) return showToast("Please share your insights.");
    if (!mood)             return showToast("Please select how you're feeling after the event.");
    if (!userId) return;

    setSubmitting(true);
    try {
      await setDoc(
        doc(db, "events", eventId, "registrations", userId),
        {
          userId,
          reflectionSubmitted: true,
          reflectionData: {
            firstName, lastName, rolePosition,
            chapterId: chapterId || eventName,
            ratings: { q1, q2, q3, q4, q5, q6, q7, q8 },
            mood,
            insights,
            submittedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      await updateDoc(doc(db, "users", userId), { xp: increment(25) });

      await addDoc(collection(db, "users", userId, "xpLog"), {
        source: "reflection", sourceId: eventId,
        description: `Post-event reflection for ${eventName}`,
        xp: 25, createdAt: serverTimestamp(),
      });

      router.replace(`/events/${eventId}?reflected=1`);
    } catch (err: unknown) {
      console.error("Reflection submit error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToast(`Failed to submit: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!authReady) {
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

  // ── Already submitted ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Link href={`/events/${eventId}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors font-heading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Event Details
          </Link>
          <span className="text-sm font-heading font-semibold tracking-widest uppercase text-text-primary">Post-Event Reflection</span>
          <div className="w-24" />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
          <div className="text-6xl mb-5">🎉</div>
          <h2 className="font-heading text-2xl text-text-primary mb-2">
            {alreadySubmitted ? "Already Submitted!" : "Reflection Submitted!"}
          </h2>
          <div className="text-3xl font-bold text-yellow-400 mb-4 font-mono">+25 XP</div>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-8">
            Your reflection for <strong className="text-text-primary">{eventName}</strong> has been recorded.
          </p>
          <Link href={`/events/${eventId}`} className="px-6 py-3 bg-accent-highlight hover:bg-accent-primary rounded-xl text-white font-heading font-medium transition-colors">
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href={`/events/${eventId}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors font-heading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Event Details
        </Link>
        <span className="text-sm font-heading font-semibold tracking-widest uppercase text-text-primary">Post-Event Reflection</span>
        <div className="w-24" />
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-6">

        {/* Header card */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h1 className="font-heading text-xl text-text-primary mb-2">Volunteer Feedback and Reflection</h1>
          <p className="text-sm text-text-secondary leading-relaxed">Please take time today to answer this quick survey for us to better understand your volunteer experience.</p>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── BASIC INFO ── */}
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">

            {/* Chapter — auto-filled from event */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                From what DEVCON Kids chapter is hosting this event? <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2 px-4 py-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm text-text-primary flex-1">{chapterId || "—"}</span>
                <span className="text-xs text-accent-highlight font-medium">Auto-filled</span>
              </div>
            </div>

            {/* First Name — auto-filled from account */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                First Name <span className="text-red-400">*</span>
              </label>
              {firstName ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-sm text-text-primary flex-1">{firstName}</span>
                  <span className="text-xs text-accent-highlight font-medium">Auto-filled</span>
                </div>
              ) : (
                <input
                  type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your answer"
                  className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary transition-shadow"
                />
              )}
            </div>

            {/* Last Name — auto-filled from account */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Last Name <span className="text-red-400">*</span>
              </label>
              {lastName ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-sm text-text-primary flex-1">{lastName}</span>
                  <span className="text-xs text-accent-highlight font-medium">Auto-filled</span>
                </div>
              ) : (
                <input
                  type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your answer"
                  className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary transition-shadow"
                />
              )}
            </div>

            {/* Role — auto-filled from registration */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Roles and Position assigned <span className="text-red-400">*</span>
              </label>
              {rolePosition ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-sm text-text-primary flex-1">{rolePosition}</span>
                  <span className="text-xs text-accent-highlight font-medium">Auto-filled</span>
                </div>
              ) : (
                <input
                  type="text" value={rolePosition} onChange={(e) => setRolePosition(e.target.value)}
                  placeholder="Your answer"
                  className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary transition-shadow"
                />
              )}
            </div>

            {/* Date of Event — pre-filled */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Date of Event <span className="text-red-400">*</span>
              </label>
              <div className="px-4 py-3 bg-white/5 border border-border rounded-lg text-sm text-text-primary">
                {eventDate || "—"}
              </div>
            </div>
          </div>

          {/* ── PRE-EVENT ── */}
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

          {/* ── DURING EVENT ── */}
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

          {/* ── INSIGHTS ── */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <label className="block text-sm font-heading text-text-primary mb-3">
              Share insights, suggestions about your personal experience in being part of the team.
              <span className="text-red-400 ml-1">*</span>
            </label>
            <textarea
              rows={4} value={insights} onChange={(e) => setInsights(e.target.value)}
              placeholder="Your answer"
              className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none transition-shadow"
            />
          </div>

          {/* ── MOOD ── */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <label className="block text-sm font-heading text-text-primary mb-4">
              How are you feeling after today&apos;s event?
              <span className="text-red-400 ml-1">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: "drained",   emoji: "🥱", label: "Drained"   },
                { key: "okay",      emoji: "🙂", label: "Okay"      },
                { key: "good",      emoji: "😊", label: "Good"      },
                { key: "energized", emoji: "🔥", label: "Energized" },
              ].map((m) => (
                <button
                  key={m.key} type="button"
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
            type="submit" disabled={submitting}
            className="w-full py-4 bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-heading font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent-primary/20"
          >
            {submitting
              ? <span className="flex gap-1.5">{WAVE_COLORS.map((color, i) => <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />)}</span>
              : <>SUBMIT REFLECTION →</>
            }
          </button>
        </form>
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
//.