"use client";

import { PodiumSlot } from "./PodiumSlot";
import type { ChapterSessionUser, ChapterVolunteer } from "@/types/chapter";

export function LeaderboardPodium({
  top3,
  currentUser,
}: {
  top3: ChapterVolunteer[];
  currentUser: ChapterSessionUser | null;
}) {
  return (
    <div
      className="rounded-2xl bg-surface border border-border p-6 animate-fade-up"
      style={{ animationDelay: "80ms" }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-[0.03] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #F5C518, transparent 70%)",
        }}
      />

      <div className="relative flex items-end gap-3 sm:gap-6">
        <PodiumSlot
          volunteer={top3[1]}
          rank={2}
          isCurrentUser={top3[1]?.uid === currentUser?.uid}
        />
        <PodiumSlot
          volunteer={top3[0]}
          rank={1}
          isCurrentUser={top3[0]?.uid === currentUser?.uid}
        />
        <PodiumSlot
          volunteer={top3[2]}
          rank={3}
          isCurrentUser={top3[2]?.uid === currentUser?.uid}
        />
      </div>
    </div>
  );
}
