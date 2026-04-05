"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { useAuth } from "@/context/AuthContext";
import type { EventDoc, EventRegistration, ReflectionRatingKey } from "@/lib/events/types";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";

const LIKERT_QUESTIONS: { key: ReflectionRatingKey; label: string; section: "pre" | "during" }[] = [
  { key: "q1", label: "My volunteer role(s) were clearly stated", section: "pre" },
  { key: "q2", label: "Reporting instructions were clearly stated", section: "pre" },
  { key: "q3", label: "Reporting instructions were complete", section: "pre" },
  { key: "q4", label: "I received enough materials and support", section: "pre" },
  { key: "q5", label: "I felt overwhelmed during the event", section: "during" },
  { key: "q6", label: "My work was essential to the event's success", section: "during" },
  { key: "q7", label: "I was given enough time for my tasks", section: "during" },
  { key: "q8", label: "I had access to help when I needed it", section: "during" },
];

const MOOD_EMOJI: Record<string, string> = {
  drained: "🥱",
  okay: "🙂",
  good: "😊",
  energized: "🔥",
};

const MOOD_COLOR: Record<string, string> = {
  drained: "bg-red-500/15 text-red-400 border-red-500/30",
  okay: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  good: "bg-team-sustainability/15 text-team-sustainability border-team-sustainability/30",
  energized: "bg-accent-highlight/15 text-accent-highlight border-accent-highlight/30",
};

export default function ReflectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const targetUserId = params.userId as string;
  const { ready } = useRequireDashboardAuth();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDoc | null>(null);
  const [reg, setReg] = useState<EventRegistration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;

    if (user.role !== "coordinator") {
      router.replace(`/events/${eventId}`);
      return;
    }

    async function load() {
      try {
        const [eventSnap, regSnap] = await Promise.all([
          getDoc(doc(db, "events", eventId)),
          getDoc(doc(db, "events", eventId, "registrations", targetUserId)),
        ]);

        if (!eventSnap.exists() || !regSnap.exists()) {
          router.replace(`/events/${eventId}`);
          return;
        }

        setEvent({ eventId, ...eventSnap.data() } as EventDoc);
        setReg(regSnap.data() as EventRegistration);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [ready, user, eventId, targetUserId, router]);

  if (loading || !ready) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-accent-highlight"
              style={{ animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!event || !reg) return null;

  const { reflectionData } = reg;

  const coordinatorAvatarUrl = buildAvatarUrl(user!.username, user!.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div className="min-h-screen bg-base pb-16">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/events/${eventId}`}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-heading text-xl text-text-primary tracking-wide truncate min-w-0">
            {reg.username ?? targetUserId}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coordinatorAvatarUrl}
              alt="Profile"
              width={36}
              height={36}
              className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors"
            />
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-5">
        {/* Volunteer identity card */}
        <div className="rounded-2xl bg-surface border border-border p-5 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={buildAvatarUrl(reg.username ?? targetUserId, reg.avatarOptions ?? DEFAULT_AVATAR)}
            alt=""
            width={48}
            height={48}
            className="rounded-xl border border-border shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-base font-heading font-semibold text-text-primary truncate">
              {reg.username ?? targetUserId}
            </p>
            <p className="text-sm text-text-secondary truncate">{reg.role}</p>
          </div>
          {reflectionData && (
            <div className={`shrink-0 px-3 py-1.5 rounded-full border text-sm font-medium flex items-center gap-1.5 ${MOOD_COLOR[reflectionData.mood] ?? "bg-surface text-text-muted border-border"}`}>
              <span>{MOOD_EMOJI[reflectionData.mood] ?? "—"}</span>
              <span className="capitalize">{reflectionData.mood}</span>
            </div>
          )}
        </div>

        {!reflectionData ? (
          <div className="rounded-2xl bg-surface border border-border p-8 text-center">
            <p className="text-text-muted text-sm">This volunteer has not submitted a reflection yet.</p>
          </div>
        ) : (
          <>
            {/* Submission timestamp */}
            {reflectionData.submittedAt && (
              <p className="text-xs text-text-muted text-right">
                Submitted{" "}
                {reflectionData.submittedAt.toDate().toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}

            {/* Pre-event responses */}
            <div className="rounded-2xl bg-surface border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-highlight shrink-0" />
                <h2 className="font-heading text-sm text-text-muted uppercase tracking-wider">Pre-Event Preparation</h2>
              </div>
              <div className="divide-y divide-border">
                {LIKERT_QUESTIONS.filter((q) => q.section === "pre").map((q) => {
                  const val = reflectionData.ratings[q.key];
                  return (
                    <div key={q.key} className="px-5 py-4 flex items-center gap-4">
                      <p className="text-sm text-text-secondary flex-1 leading-relaxed">{q.label}</p>
                      <div className="flex gap-1.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <div
                            key={v}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-heading font-medium ${
                              v === val
                                ? "bg-accent-highlight text-white"
                                : "bg-base border border-border text-text-muted"
                            }`}
                          >
                            {v}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* During-event responses */}
            <div className="rounded-2xl bg-surface border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-team-community shrink-0" />
                <h2 className="font-heading text-sm text-text-muted uppercase tracking-wider">During the Event</h2>
              </div>
              <div className="divide-y divide-border">
                {LIKERT_QUESTIONS.filter((q) => q.section === "during").map((q) => {
                  const val = reflectionData.ratings[q.key];
                  return (
                    <div key={q.key} className="px-5 py-4 flex items-center gap-4">
                      <p className="text-sm text-text-secondary flex-1 leading-relaxed">{q.label}</p>
                      <div className="flex gap-1.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <div
                            key={v}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-heading font-medium ${
                              v === val
                                ? "bg-team-community text-white"
                                : "bg-base border border-border text-text-muted"
                            }`}
                          >
                            {v}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insights */}
            {reflectionData.insights && (
              <div className="rounded-2xl bg-surface border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="font-heading text-sm text-text-muted uppercase tracking-wider">Insights &amp; Suggestions</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-text-secondary leading-relaxed italic">
                    "{reflectionData.insights}"
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
