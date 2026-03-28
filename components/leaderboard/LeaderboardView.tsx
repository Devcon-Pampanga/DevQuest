"use client";

import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { ChapterSwitcherDropdown } from "@/components/chapter/ChapterSwitcherDropdown";
import { LeaderboardSkeleton } from "./LeaderboardSkeleton";
import { LeaderboardChapterHeader } from "./LeaderboardChapterHeader";
import { LeaderboardFilters } from "./LeaderboardFilters";
import { LeaderboardEmptyState } from "./LeaderboardEmptyState";
import { LeaderboardPodium } from "./LeaderboardPodium";
import { YourRankCard } from "./YourRankCard";
import { RankRow } from "./RankRow";
import { useLeaderboardSession } from "@/hooks/useLeaderboardSession";
import { useLeaderboardVolunteers } from "@/hooks/useLeaderboardVolunteers";
import { useLeaderboardRankings } from "@/hooks/useLeaderboardRankings";
import { useLeaderboardFilters } from "@/hooks/useLeaderboardFilters";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";

export function LeaderboardView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { authChecked, currentUser, viewingChapterId, setViewingChapterId } =
    useLeaderboardSession(router, searchParams);
  const { teamFilter, setTeamFilter, seasonTab, setSeasonTab } =
    useLeaderboardFilters(viewingChapterId);
  const { volunteers, loadingData } = useLeaderboardVolunteers(viewingChapterId);
  const { filtered, top3, rest, myRank, me, xpToNext } = useLeaderboardRankings(
    volunteers,
    teamFilter,
    currentUser
  );

  const avatarUrl = currentUser
    ? buildAvatarUrl(currentUser.username, currentUser.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  const chapterDropdownAction = authChecked ? (
    <ChapterSwitcherDropdown
      currentUser={currentUser}
      viewingChapterId={viewingChapterId}
      setViewingChapterId={setViewingChapterId}
    />
  ) : undefined;

  return (
    <PageShell
      title="Leaderboard"
      avatarUrl={avatarUrl}
      loading={!authChecked || loadingData}
      skeleton={<LeaderboardSkeleton />}
      backHref="/chapter"
      actions={chapterDropdownAction}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-10">

          <LeaderboardChapterHeader viewingChapterId={viewingChapterId} />

          {me && myRank > 0 && (
            <YourRankCard
              volunteer={me}
              rank={myRank}
              total={filtered.length}
              xpToNext={xpToNext}
            />
          )}

          <LeaderboardFilters
            seasonTab={seasonTab}
            setSeasonTab={setSeasonTab}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            filteredCount={filtered.length}
          />

          {filtered.length === 0 ? (
            <LeaderboardEmptyState
              teamFilter={teamFilter}
              onViewAllTeams={() => setTeamFilter("all")}
            />
          ) : (
            <>
              <LeaderboardPodium top3={top3} currentUser={currentUser} />

              {rest.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 mb-2 animate-fade-up" style={{ animationDelay: "160ms" }}>
                    <span className="font-heading text-[10px] text-text-muted uppercase tracking-widest">
                      Full Rankings
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-[10px] text-text-muted tabular-nums">
                      {filtered.length} volunteer{filtered.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {rest.map((v, i) => (
                    <RankRow
                      key={`${teamFilter}-${v.uid}`}
                      volunteer={v}
                      rank={i + 4}
                      isCurrentUser={v.uid === currentUser?.uid}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
