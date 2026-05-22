"use client";

import Link from "next/link";
import type { EventRegistration } from "@/lib/events/types";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";

const MOOD_EMOJI: Record<string, string> = {
  drained: "🥱",
  okay: "🙂",
  good: "😊",
  energized: "🔥",
};

const MOOD_COLOR: Record<string, string> = {
  drained: "bg-red-500/15 text-red-400 border-red-500/25",
  okay: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  good: "bg-team-sustainability/15 text-team-sustainability border-team-sustainability/25",
  energized: "bg-accent-highlight/15 text-accent-highlight border-accent-highlight/25",
};

interface ReflectionCardProps {
  eventId: string;
  registration: EventRegistration;
}

export function ReflectionCard({ eventId, registration }: ReflectionCardProps) {
  const { reflectionData } = registration;
  if (!reflectionData) return null;

  const mood = reflectionData.mood;
  const avgRating =
    Object.values(reflectionData.ratings).reduce((a, b) => a + b, 0) /
    Object.values(reflectionData.ratings).length;

  return (
    <Link
      href={`/events/${eventId}/reflections/${registration.userId}`}
      className="block rounded-2xl bg-surface border border-border p-4 hover:border-accent-primary/40 transition-colors group"
    >
      <div className="flex items-center gap-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={buildAvatarUrl(registration.username ?? registration.userId, registration.avatarOptions ?? DEFAULT_AVATAR)}
          alt=""
          width={36}
          height={36}
          className="rounded-xl border border-border shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary font-medium truncate group-hover:text-accent-highlight transition-colors">
            {registration.username ?? registration.userId}
          </p>
          <p className="text-xs text-text-muted truncate">{registration.role}</p>
        </div>
        <div className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${MOOD_COLOR[mood] ?? "bg-surface text-text-muted border-border"}`}>
          <span>{MOOD_EMOJI[mood] ?? "—"}</span>
          <span className="capitalize">{mood}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted mb-2">
        <span>Avg. rating</span>
        <span className="font-heading font-semibold text-text-secondary tabular-nums">{avgRating.toFixed(1)} / 5</span>
      </div>

      {reflectionData.insights ? (
        <p className="text-xs text-text-muted leading-relaxed line-clamp-2 italic">
          &ldquo;{reflectionData.insights}&rdquo;
        </p>
      ) : (
        <p className="text-xs text-text-muted italic">No additional insights</p>
      )}
    </Link>
  );
}
