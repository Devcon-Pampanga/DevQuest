"use client";

import Link from "next/link";
import { useReflectionForm } from "@/hooks/useReflectionForm";
import { LikertScale } from "./LikertScale";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import type { ReflectionMood } from "@/lib/events/types";

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

// ─── Reflection success overlay ────────────────────────────────────────────────

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

// ─── Main view ─────────────────────────────────────────────────────────────────

export function ReflectionView({ eventId }: { eventId: string }) {
  const {
    ready,
    user,
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
  } = useReflectionForm(eventId);

  if (!ready || !authReady) {
    return (
      <div className="flex flex-col min-h-screen animate-pulse">
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a1a2e]" />
            <div className="w-40 h-5 rounded-full bg-[#1a1a2e]" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#1a1a2e]" />
        </div>
        <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3">
            <div className="w-48 h-5 rounded-full bg-[#1a1a2e]" />
            <div className="w-full h-3 rounded-full bg-[#1a1a2e]" />
            <div className="w-3/4 h-3 rounded-full bg-[#1a1a2e]" />
          </div>
          <div className="h-12 rounded-xl bg-[#1a1a2e]" />
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
          <div className="w-full h-14 rounded-xl bg-[#1a1a2e]" />
        </div>
      </div>
    );
  }

  if (showSuccessOverlay) return <ReflectionSuccessOverlay />;

  const avatarUrl = buildAvatarUrl(user!.username, user!.avatarOptions ?? DEFAULT_AVATAR);

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

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Date of Event <span className="text-red-400">*</span>
            </label>
            <div className="px-4 py-3 bg-white/5 border border-border rounded-lg text-sm text-text-primary">
              {eventDate || "—"}
            </div>
          </div>
        </div>

        {/* Pre-event section */}
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

        {/* During event section */}
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
