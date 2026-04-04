"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { TEAM_META } from "@/lib/seed/quests";
import { useQuestData } from "@/hooks/useQuestData";
import { useQuestActions } from "@/hooks/useQuestActions";
import { useXpActivityLog } from "@/hooks/useXpActivityLog";
import { useShareLinkCopy } from "@/hooks/useShareLinkCopy";
import { buildVolunteerBadgeList } from "@/lib/volunteerBadges";
import { generateVolunteerProfileResume } from "@/lib/profileResume";
import PageShell from "@/components/layout/PageShell";
import { ChapterLeaderboardPanel } from "@/components/chapter/ChapterLeaderboardPanel";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileStatCards } from "@/components/profile/ProfileStatCards";
import { ProfileMilestonesSection } from "@/components/profile/ProfileMilestonesSection";
import { ProfileActivityFeed } from "@/components/profile/ProfileActivityFeed";
import { ProfileBadgesGrid } from "@/components/profile/ProfileBadgesGrid";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { MissionsPanel } from "@/components/quests/missions/MissionsPanel";
import { CoordinatorDashboardPage } from "@/components/profile/CoordinatorDashboardPage";
import { useLeaderboardVolunteers } from "@/hooks/useLeaderboardVolunteers";
import type { MissionApprovalItem } from "@/types/mission";
import type { ApprovalsQueueItem } from "@/types/quest";
import type { ProfilePageUser } from "@/components/profile/types";

export function ProfileDashboardPage() {
  const { user: sessionUser, status } = useAuth();
  const { ready } = useRequireDashboardAuth();

  const userData = useMemo((): ProfilePageUser | null => {
    if (!sessionUser) return null;
    return {
      uid: sessionUser.uid,
      username: sessionUser.username,
      email: sessionUser.email,
      role: sessionUser.role,
      chapterId: sessionUser.chapterId,
      teams: sessionUser.teams,
      xp: sessionUser.xp,
      contactNumber: sessionUser.contactNumber,
      linkedinUrl: sessionUser.linkedinUrl,
      githubUrl: sessionUser.githubUrl,
      resumeUrl: sessionUser.resumeUrl,
      createdAt: sessionUser.createdAt,
      avatarOptions: sessionUser.avatarOptions,
      onboardingComplete: sessionUser.onboardingComplete,
      devCoins: sessionUser.devCoins,
    };
  }, [sessionUser]);

  const firebaseUid = sessionUser?.uid ?? "";
  const [activeTeam, setActiveTeam] = useState("");
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [, setApprovals] = useState<ApprovalsQueueItem[]>([]);
  const [missionApprovals, setMissionApprovals] = useState<MissionApprovalItem[]>([]);
  const [, setExpandedQuestId] = useState<string | null>(null);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
  const { copied, copyUrl } = useShareLinkCopy();

  const chapterId = userData?.chapterId ?? "";
  const {
    quests: allQuests,
    completions,
    setCompletions,
    missions,
    missionCompletions,
    setMissionCompletions,
    reflectionCount,
    eventCount,
    profileSetupCount,
    loadingQuests,
    loadingMissions,
  } = useQuestData(firebaseUid, chapterId);

  const { rawEntries: xpLogRaw, loading: xpLogLoading, hasMore: activityHasMore } =
    useXpActivityLog(firebaseUid);
  const { volunteers: leaderboardVolunteers } = useLeaderboardVolunteers(chapterId);
  const {
    submitting,
    handleJoinMission,
    handleSubmitMission,
    handleApproveMission,
    handleReviseMission,
  } = useQuestActions({
    uid: firebaseUid,
    setCompletions,
    setMissionCompletions,
    setApprovals,
    setMissionApprovals,
    setExpandedQuestId,
    setExpandedMissionId,
  });

  useEffect(() => {
    const teams = userData?.teams ?? [];
    if (teams.length > 0) {
      setActiveTeam((prev) => (prev && teams.includes(prev) ? prev : teams[0]));
    }
  }, [userData?.teams]);

  const completedQuestCount = useMemo(
    () => Object.values(completions).filter((c) => c.status === "completed").length,
    [completions]
  );

  const badges = useMemo(() => {
    if (!userData) return [];
    return buildVolunteerBadgeList({
      teams: userData.teams ?? [],
      completions,
      allQuests,
      eventCount,
      reflectionCount,
      completedQuestCount,
      profileSetupCount,
      xp: userData.xp ?? 0,
    });
  }, [
    userData,
    completions,
    allQuests,
    eventCount,
    reflectionCount,
    completedQuestCount,
    profileSetupCount,
  ]);

  const badgesEarned = useMemo(() => badges.filter((b) => b.earned).length, [badges]);
  const leaderboard = useMemo(
    () => [...leaderboardVolunteers].sort((a, b) => b.xp - a.xp),
    [leaderboardVolunteers]
  );

  const activityEntries = xpLogRaw.slice(0, 20);
  const loading = loadingQuests || xpLogLoading;

  function handleCopyShare() {
    if (!userData || typeof window === "undefined") return;
    copyUrl(`${window.location.origin}/profile/${userData.uid}`);
  }

  async function handleGenerateResume() {
    if (!userData || typeof window === "undefined") return;
    setIsGeneratingResume(true);
    try {
      await generateVolunteerProfileResume({
        userData: {
          username: userData.username,
          chapterId: userData.chapterId,
          xp: userData.xp ?? 0,
          role: userData.role,
          linkedinUrl: userData.linkedinUrl,
          githubUrl: userData.githubUrl,
          teams: userData.teams ?? [],
          createdAt: userData.createdAt,
        },
        completions,
        allQuests,
        badges,
        eventCount,
        reflectionCount,
        completedQuestCount,
        badgesEarned,
      });
    } finally {
      setIsGeneratingResume(false);
    }
  }

  const authLoading = status === "loading" || !ready;

  if (authLoading || !userData) {
    return (
      <PageShell title="Profile" loading skeleton={<ProfileSkeleton />}>
        {null}
      </PageShell>
    );
  }

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);
  const teams = userData.teams ?? [];
  const milestoneTeam = activeTeam && teams.includes(activeTeam) ? activeTeam : teams[0] ?? "";
  const primaryTeamColor = teams[0] && TEAM_META[teams[0]] ? TEAM_META[teams[0]].color : "#A855F7";

  return (
    <PageShell
      title={userData.role === "coordinator" ? "Dashboard" : "Profile"}
      avatarUrl={avatarUrl}
      loading={loading}
      skeleton={<ProfileSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-6">
        {userData.role === "coordinator" ? (
          <CoordinatorDashboardPage
            userData={userData}
            avatarUrl={avatarUrl}
            onGenerateResume={handleGenerateResume}
            isGeneratingResume={isGeneratingResume}
            onCopyShare={handleCopyShare}
            copied={copied}
          />
        ) : (
          <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:gap-6 items-stretch lg:items-start pb-10">
            <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "0ms" }}>
              <ProfileHeaderCard
                userData={userData}
                avatarUrl={avatarUrl}
                onGenerateResume={handleGenerateResume}
                isGeneratingResume={isGeneratingResume}
                onCopyShare={handleCopyShare}
                copied={copied}
              />
            </div>

            <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
              <ProfileStatCards eventCount={eventCount} badgesEarned={badgesEarned} />
            </div>

            <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-2 order-3 lg:order-none">
              {milestoneTeam ? (
                <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
                  <ProfileMilestonesSection
                    userData={userData}
                    completions={completions}
                    allQuests={allQuests}
                    activeTeam={milestoneTeam}
                    onTeamChange={setActiveTeam}
                  />
                </div>
              ) : null}
              <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
                <MissionsPanel
                  userData={userData}
                  missions={missions}
                  missionCompletions={missionCompletions}
                  missionApprovals={missionApprovals}
                  loadingMissions={loadingMissions}
                  loadingMissionApprovals={false}
                  expandedMissionId={expandedMissionId}
                  setExpandedMissionId={setExpandedMissionId}
                  submitting={submitting}
                  onJoin={handleJoinMission}
                  onSubmit={handleSubmitMission}
                  onApprove={handleApproveMission}
                  onRevise={handleReviseMission}
                />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
                <ProfileActivityFeed entries={activityEntries} hasMore={activityHasMore} />
              </div>
            </div>

            <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-1 order-2 lg:order-none">
              <div className="animate-fade-up" style={{ animationDelay: "210ms" }}>
                <ChapterLeaderboardPanel
                  viewingChapterId={chapterId}
                  leaderboard={leaderboard}
                  currentUserId={userData.uid}
                  displayLimit={3}
                  showCurrentUserOutsideLimit
                />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
                <ProfileBadgesGrid badges={badges} teamColor={primaryTeamColor} />
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
