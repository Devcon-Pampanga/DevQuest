"use client";

import { Suspense } from "react";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";

export default function LeaderboardPage() {
  return (
    <Suspense>
      <LeaderboardView />
    </Suspense>
  );
}
