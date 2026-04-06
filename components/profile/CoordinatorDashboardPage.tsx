"use client";

import { useEffect, useMemo, useState } from "react";
import { ChapterLeaderboardPanel } from "@/components/chapter/ChapterLeaderboardPanel";
import { ChapterTeamBreakdown } from "@/components/chapter/ChapterTeamBreakdown";
import { ChapterVolunteersSection } from "@/components/chapter/ChapterVolunteersSection";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { CoordinatorStatsRow } from "@/components/quests/coordinator/CoordinatorStatsRow";
import { MissionsPanel } from "@/components/quests/missions/MissionsPanel";
import { useChapterVolunteersUI } from "@/hooks/useChapterVolunteersUI";
import { useCoordinatorHubData } from "@/hooks/useCoordinatorHubData";
import { useLeaderboardVolunteers } from "@/hooks/useLeaderboardVolunteers";
import { useQuestActions } from "@/hooks/useQuestActions";
import { useQuestData } from "@/hooks/useQuestData";
import type { MissionApprovalItem } from "@/types/mission";
import type { ProfilePageUser } from "@/components/profile/types";
import type { ApprovalsQueueItem, QuestCompletion } from "@/types/quest";

interface CoordinatorDashboardPageProps {
  userData: ProfilePageUser;
  avatarUrl: string;
  copied: boolean;
  onCopyShare: () => void;
  onGenerateResume: () => void | Promise<void>;
  isGeneratingResume: boolean;
}

export function CoordinatorDashboardPage({
  userData,
  avatarUrl,
  copied,
  onCopyShare,
  onGenerateResume,
  isGeneratingResume,
}: CoordinatorDashboardPageProps) {
  const {
    volunteers,
    missions,
    missionApprovals: initialMissionApprovals,
    pendingApprovalsCount,
  } = useCoordinatorHubData(userData.chapterId);
  const {
    missions: activeMissions,
    missionCompletions,
    setMissionCompletions,
    loadingMissions,
  } = useQuestData(userData.uid, userData.chapterId);
  const { volunteers: leaderboardVolunteers } = useLeaderboardVolunteers(userData.chapterId);

  const {
    search,
    setSearch,
    teamFilter,
    setTeamFilter,
    volunteerPage,
    setVolunteerPage,
    VOLUNTEER_PAGE_SIZE,
    filteredVolunteers,
    pagedVolunteers,
    volunteerTotalPages,
  } = useChapterVolunteersUI(volunteers, userData.chapterId);

  const [, setApprovals] = useState<ApprovalsQueueItem[]>([]);
  const [, setCompletions] = useState<Record<string, QuestCompletion>>({});
  const [missionApprovals, setMissionApprovals] = useState<MissionApprovalItem[]>([]);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);

  useEffect(() => {
    setMissionApprovals(initialMissionApprovals);
  }, [initialMissionApprovals]);

  const { submitting, handleApproveMission, handleReviseMission } = useQuestActions({
    uid: userData.uid,
    setCompletions,
    setMissionCompletions,
    setApprovals,
    setMissionApprovals,
    setExpandedQuestId: () => undefined,
    setExpandedMissionId,
  });

  const leaderboard = useMemo(
    () => [...leaderboardVolunteers].sort((a, b) => b.xp - a.xp),
    [leaderboardVolunteers]
  );

  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:gap-6 items-stretch lg:items-start pb-10">
      <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "0ms" }}>
        <ProfileHeaderCard
          userData={userData}
          avatarUrl={avatarUrl}
          onGenerateResume={onGenerateResume}
          isGeneratingResume={isGeneratingResume}
          onCopyShare={onCopyShare}
          copied={copied}
        />
      </div>

      <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <CoordinatorStatsRow
          volunteerCount={volunteers.length}
          pendingApprovalsCount={pendingApprovalsCount}
          activeSubquestCount={missions.filter((mission) => mission.status === "active").length}
        />
      </div>

      <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-2">
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <ChapterVolunteersSection
            volunteers={volunteers}
            filteredVolunteers={filteredVolunteers}
            pagedVolunteers={pagedVolunteers}
            volunteerPage={volunteerPage}
            setVolunteerPage={setVolunteerPage}
            volunteerTotalPages={volunteerTotalPages}
            volunteerPageSize={VOLUNTEER_PAGE_SIZE}
            search={search}
            setSearch={setSearch}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            currentUserId={userData.uid}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
          <MissionsPanel
            userData={{
              uid: userData.uid,
              username: userData.username,
              role: userData.role,
              teams: userData.teams,
            }}
            missions={activeMissions}
            missionCompletions={missionCompletions}
            missionApprovals={missionApprovals}
            loadingMissions={loadingMissions}
            loadingMissionApprovals={false}
            expandedMissionId={expandedMissionId}
            setExpandedMissionId={setExpandedMissionId}
            submitting={submitting}
            onJoin={() => undefined}
            onSubmit={() => undefined}
            onApprove={handleApproveMission}
            onRevise={handleReviseMission}
          />
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-1">
        <div className="animate-fade-up" style={{ animationDelay: "210ms" }}>
          <ChapterLeaderboardPanel
            viewingChapterId={userData.chapterId}
            leaderboard={leaderboard}
            currentUserId={userData.uid}
            displayLimit={3}
            showCurrentUserOutsideLimit
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
          <ChapterTeamBreakdown volunteers={volunteers} />
        </div>
      </div>
    </div>
  );
}
