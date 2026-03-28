"use client";

import { useMemo, useCallback } from "react";
import PageShell from "@/components/layout/PageShell";
import { DashboardSkeleton, DashboardPageShellLoading } from "@/components/dashboard/DashboardSkeleton";
import { DashboardIdentityHero } from "@/components/dashboard/DashboardIdentityHero";
import { DashboardReflectionNudge } from "@/components/dashboard/DashboardReflectionNudge";
import { DashboardQuickStats } from "@/components/dashboard/DashboardQuickStats";
import { DashboardActiveQuestsSection } from "@/components/dashboard/DashboardActiveQuestsSection";
import { DashboardUpcomingEventsSection } from "@/components/dashboard/DashboardUpcomingEventsSection";
import { DashboardCoordinatorPanel } from "@/components/dashboard/DashboardCoordinatorPanel";
import { DashboardTeamProgressSection, type TeamProgressRow } from "@/components/dashboard/DashboardTeamProgressSection";
import { DashboardLeaderboardSnippet } from "@/components/dashboard/DashboardLeaderboardSnippet";
import { useChapterSession } from "@/hooks/useChapterSession";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useShareLinkCopy } from "@/hooks/useShareLinkCopy";
import { TEAM_META, TIER_ORDER, TIER_LABELS } from "@/lib/seed/quests";
import { getXpLevelProgress } from "@/lib/xpLevel";
import {
  pickPrimaryTeam,
  isTierUnlocked,
  getCurrentTier,
  getQuestUIStatus,
} from "@/lib/quest-utils";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";

export default function DashboardPage() {
  const { authChecked, currentUser } = useChapterSession();
  const { copied, copyUrl } = useShareLinkCopy();

  const {
    allQuests,
    completions,
    eventsAttendedCount,
    events,
    pendingReflection,
    dashboardLoading,
    approvalsCount,
    chapterVolunteersActive,
    eventsThisMonthCount,
    upcomingRegCounts,
    leaderboard,
    userLeaderboardRank,
    barsReady,
  } = useDashboardData(currentUser, authChecked);

  const handleShare = useCallback(() => {
    if (!currentUser || typeof window === "undefined") return;
    const url = `${window.location.origin}/profile/${encodeURIComponent(currentUser.username)}`;
    copyUrl(url);
  }, [currentUser, copyUrl]);

  const primaryTeamId = useMemo(
    () => pickPrimaryTeam(currentUser?.teams ?? [], completions, allQuests),
    [currentUser?.teams, completions, allQuests]
  );

  const primaryMeta = primaryTeamId ? TEAM_META[primaryTeamId] : undefined;
  const teamColor = primaryMeta?.color ?? "#A855F7";

  const currentTier = useMemo(() => {
    if (!primaryTeamId) return null;
    return getCurrentTier(primaryTeamId, completions, allQuests);
  }, [primaryTeamId, completions, allQuests]);

  const activeQuestCards = useMemo(() => {
    if (!primaryTeamId || currentTier === null) return [];
    const tierUnlocked = isTierUnlocked(primaryTeamId, currentTier, completions, allQuests);
    const tierQuests = allQuests.filter((q) => q.teamId === primaryTeamId && q.tier === currentTier);
    const withStatus = tierQuests.map((q) => ({
      quest: q,
      status: getQuestUIStatus(q, completions, tierUnlocked),
    }));
    const interesting = withStatus.filter((x) => x.status === "in_progress" || x.status === "available");
    interesting.sort((a, b) => {
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (a.status !== "in_progress" && b.status === "in_progress") return 1;
      return 0;
    });
    return interesting.slice(0, 3).map((x) => x.quest);
  }, [primaryTeamId, currentTier, allQuests, completions]);

  const upcomingChapterEvents = useMemo(() => {
    if (!currentUser) return [];
    const now = new Date();
    return events
      .filter((e) => e.chapterId === currentUser.chapterId && e.date.toDate() > now)
      .sort((a, b) => a.date.toMillis() - b.date.toMillis())
      .slice(0, 5);
  }, [events, currentUser]);

  const completedQuestCount = useMemo(
    () => Object.values(completions).filter((c) => c.status === "completed").length,
    [completions]
  );

  const xpProgress = useMemo(() => getXpLevelProgress(currentUser?.xp ?? 0), [currentUser?.xp]);

  const teamProgressMap = useMemo(() => {
    if (!currentUser || allQuests.length === 0) return {} as Record<string, TeamProgressRow>;
    return Object.fromEntries(
      currentUser.teams.map((teamId) => {
        const tier = getCurrentTier(teamId, completions, allQuests);
        const tierQuests = allQuests.filter((q) => q.teamId === teamId && q.tier === tier);
        const completed = tierQuests.filter((q) => completions[q.questId]?.status === "completed").length;
        const total = tierQuests.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 100;
        const tierIdx = TIER_ORDER.indexOf(tier);
        const nextTierKey = tierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[tierIdx + 1] : null;
        const isMaxTier = tier === "lead" && completed === total && total > 0;
        const nextLabel = nextTierKey && !isMaxTier ? TIER_LABELS[nextTierKey] : null;
        return [teamId, { currentTier: tier, completed, total, pct, nextLabel, isMaxTier }];
      })
    );
  }, [currentUser, allQuests, completions]);

  if (!authChecked || !currentUser) {
    return <DashboardPageShellLoading />;
  }

  const activeAvatar = currentUser.avatarOptions ?? DEFAULT_AVATAR;
  const avatarUrl = buildAvatarUrl(currentUser.username, activeAvatar);

  return (
    <>
      <PageShell
        title="Dashboard"
        avatarUrl={avatarUrl}
        loading={dashboardLoading}
        skeleton={<DashboardSkeleton />}
      >
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ background: `radial-gradient(ellipse 90% 420px at -5% -5%, ${teamColor}0f 0%, transparent 55%)` }}
        >
          <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-6 items-stretch lg:items-start pb-10">
            <div className="contents lg:flex lg:flex-col gap-6 lg:col-span-2">
              <DashboardIdentityHero
                user={currentUser}
                avatarUrl={avatarUrl}
                teamColor={teamColor}
                xpProgress={xpProgress}
                copiedShare={copied}
                onShare={handleShare}
              />

              {pendingReflection ? <DashboardReflectionNudge pending={pendingReflection} /> : null}

              <DashboardQuickStats
                teamColor={teamColor}
                completedQuestCount={completedQuestCount}
                eventsAttendedCount={eventsAttendedCount}
              />

              <DashboardActiveQuestsSection
                activeQuestCards={activeQuestCards}
                primaryTeamId={primaryTeamId}
                teamColor={teamColor}
              />

              <DashboardUpcomingEventsSection
                upcomingChapterEvents={upcomingChapterEvents}
                upcomingRegCounts={upcomingRegCounts}
              />
            </div>

            <div className="contents lg:flex lg:flex-col gap-4 lg:col-start-3 lg:col-span-1">
              {currentUser.role === "coordinator" ? (
                <DashboardCoordinatorPanel
                  approvalsCount={approvalsCount}
                  chapterVolunteersActive={chapterVolunteersActive}
                  eventsThisMonthCount={eventsThisMonthCount}
                />
              ) : null}

              <DashboardTeamProgressSection
                teamIds={currentUser.teams}
                teamProgressMap={teamProgressMap}
                barsReady={barsReady}
              />

              <DashboardLeaderboardSnippet
                leaderboard={leaderboard}
                currentUser={currentUser}
                userLeaderboardRank={userLeaderboardRank}
                teamColor={teamColor}
                avatarUrl={avatarUrl}
              />
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
