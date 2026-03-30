"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getDocs,
  collection,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { AvatarOptions, DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { useQuestData } from "@/hooks/useQuestData";
import { useQuestActions } from "@/hooks/useQuestActions";
import { useTeamQuestMetrics } from "@/hooks/useTeamQuestMetrics";
import { QuestTierSection } from "@/components/quests/QuestTierSection";
import { QuestFilterBar } from "@/components/quests/QuestFilterBar";
import { TeamQuestProgress } from "@/components/quests/TeamQuestProgress";
import { ApprovalsQueue } from "@/components/quests/ApprovalsQueue";
import { PathJourneySidebar } from "@/components/quests/PathJourneySidebar";
import { MissionsPanel } from "@/components/quests/missions/MissionsPanel";
import { QuestsSkeleton } from "@/components/quests/QuestsSkeleton";
import { QuestBadgesCard } from "@/components/quests/QuestBadgesCard";
import PageShell from "@/components/layout/PageShell";
import { TEAM_META } from "@/lib/seed/quests";
import { QuestCompletion, ApprovalsQueueItem } from "@/types/quest";
import { MissionCompletion, MissionApprovalItem } from "@/types/mission";
import { CoordinatorHubPage } from "@/components/quests/coordinator/CoordinatorHubPage";
import Link from "next/link";

interface UserData {
  uid: string;
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  teams: string[];
  xp: number;
  avatarOptions?: AvatarOptions;
}

function QuestsPageContent() {
  const searchParams = useSearchParams();
  const { user: sessionUser } = useAuth();
  const { ready } = useRequireDashboardAuth();

  const userData = useMemo((): UserData | null => {
    if (!sessionUser) return null;
    return {
      uid: sessionUser.uid,
      username: sessionUser.username,
      role: sessionUser.role,
      chapterId: sessionUser.chapterId,
      teams: sessionUser.teams,
      xp: sessionUser.xp,
      avatarOptions: sessionUser.avatarOptions,
    };
  }, [sessionUser]);

  const firebaseUid = sessionUser?.uid ?? "";

  const {
    quests,
    completions,
    setCompletions,
    missions,
    missionCompletions,
    setMissionCompletions,
    reflectionCount,
    eventCount,
    profileSetupCount,
    loadingQuests: loadingCompletions,
    loadingMissions,
  } = useQuestData(firebaseUid, userData?.chapterId ?? "");

  const [approvals, setApprovals] = useState<ApprovalsQueueItem[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  const [missionApprovals, setMissionApprovals] = useState<MissionApprovalItem[]>([]);
  const [loadingMissionApprovals, setLoadingMissionApprovals] = useState(false);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("");
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.teams?.length) return;
    setActiveTab((prev) => (prev ? prev : userData.teams[0]));
  }, [userData]);

  useEffect(() => {
    if (!userData) return;
    const tab = searchParams.get("tab");
    if (tab === "approvals" && userData.role === "coordinator") {
      setActiveTab("approvals");
    }
  }, [searchParams, userData]);

  const loadApprovals = useCallback(async () => {
    if (!userData || userData.role !== "coordinator") return;
    setLoadingApprovals(true);
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("chapterId", "==", userData.chapterId))
      );
      const items: ApprovalsQueueItem[] = [];
      await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
          const u = userDoc.data();
          const completionsSnap = await getDocs(
            query(
              collection(db, "users", userDoc.id, "questCompletions"),
              where("status", "==", "pending_approval")
            )
          );
          completionsSnap.docs.forEach((cd) => {
            const c = cd.data() as QuestCompletion;
            const quest = quests.find((q) => q.questId === cd.id);
            if (!quest) return;
            items.push({
              userId: userDoc.id,
              username: u.username,
              avatarOptions: u.avatarOptions,
              teamId: quest.teamId,
              questId: quest.questId,
              questName: quest.name,
              submissionNotes: c.submissionNotes,
              evidenceUrl: c.evidenceUrl,
              xpReward: quest.xpReward,
              submittedAt: (cd.data() as Record<string, Timestamp>).updatedAt,
            });
          });
        })
      );
      setApprovals(items);
    } finally {
      setLoadingApprovals(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  useEffect(() => {
    if (ready && userData?.role === "coordinator") loadApprovals();
  }, [ready, userData, loadApprovals]);

  const loadMissionApprovals = useCallback(async () => {
    if (!userData || userData.role !== "coordinator") return;
    setLoadingMissionApprovals(true);
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("chapterId", "==", userData.chapterId))
      );
      const items: MissionApprovalItem[] = [];
      await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
          const u = userDoc.data();
          const mCompletionsSnap = await getDocs(
            query(
              collection(db, "users", userDoc.id, "missionCompletions"),
              where("status", "==", "submitted")
            )
          );
          mCompletionsSnap.docs.forEach((cd) => {
            const c = cd.data() as MissionCompletion;
            const mission = missions.find((m) => m.missionId === cd.id);
            if (!mission) return;
            items.push({
              userId: userDoc.id,
              username: u.username,
              avatarOptions: u.avatarOptions,
              missionId: mission.missionId,
              missionTitle: mission.title,
              difficulty: mission.difficulty,
              xpReward: mission.xpReward,
              submissionNotes: c.submissionNotes,
              evidenceUrl: c.evidenceUrl,
              submittedAt: (cd.data() as Record<string, Timestamp>).updatedAt,
            });
          });
        })
      );
      setMissionApprovals(items);
    } finally {
      setLoadingMissionApprovals(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, missions]);

  useEffect(() => {
    if (ready && userData?.role === "coordinator" && missions.length > 0) {
      loadMissionApprovals();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userData?.role, missions.length]);

  const {
    submitting,
    handleSelfMark,
    handleSubmitApproval,
    handleApprove,
    handleRevise,
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

  const avatarUrl = userData
    ? buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;
  const userTeams = userData?.teams ?? [];

  const tabs = [
    ...userTeams.map((t: string) => ({ key: t, label: TEAM_META[t]?.label ?? t, isApprovals: false })),
  ];

  const metrics = useTeamQuestMetrics(activeTab, quests, completions);

  // ── Coordinator: render the dedicated hub instead of the volunteer quest map ──
  // Must be after ALL hooks above to satisfy the Rules of Hooks.
  if (userData?.role === "coordinator") {
    return (
      <CoordinatorHubPage
        user={{
          uid: userData.uid,
          username: userData.username,
          chapterId: userData.chapterId,
          avatarOptions: userData.avatarOptions,
        }}
      />
    );
  }

  return (
    <PageShell
      title="Quests"
      avatarUrl={avatarUrl}
      loading={!ready || loadingCompletions}
      skeleton={<QuestsSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-5 lg:items-start">

          <QuestFilterBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(key) => {
              setActiveTab(key);
              setExpandedQuestId(null);
            }}
            approvalsCount={approvals.length}
          />

          {!loadingCompletions && activeTab === "approvals" && (
            <ApprovalsQueue
              loading={loadingApprovals}
              items={approvals}
              onRefresh={loadApprovals}
              onApprove={handleApprove}
              onRevise={handleRevise}
              submitting={submitting}
            />
          )}

          {!loadingCompletions && activeTab !== "approvals" && metrics && (
            <>
              <div className="flex flex-col gap-5 lg:col-span-2">

                <TeamQuestProgress
                  teamId={activeTab}
                  earnedTier={metrics.earnedTier}
                  earnedTierLabel={metrics.earnedTierLabel}
                  currentTierLabel={metrics.currentTierLabel}
                  nextTierLabel={metrics.nextTierLabel}
                  color={metrics.activeMeta.color}
                  quests={metrics.currentTierQuests}
                  completions={completions}
                  isMaxTier={metrics.isMaxTier}
                />

                <QuestTierSection
                  teamColor={metrics.activeMeta.color}
                  quests={metrics.currentTierQuests}
                  completions={completions}
                  expandedQuestId={expandedQuestId}
                  onToggleQuest={(questId) =>
                    setExpandedQuestId(expandedQuestId === questId ? null : questId)
                  }
                  onSelfMark={handleSelfMark}
                  onSubmitApproval={handleSubmitApproval}
                  submitting={submitting}
                />

                <MissionsPanel
                  userData={userData!}
                  missions={missions}
                  missionCompletions={missionCompletions}
                  missionApprovals={missionApprovals}
                  loadingMissions={loadingMissions}
                  loadingMissionApprovals={loadingMissionApprovals}
                  expandedMissionId={expandedMissionId}
                  setExpandedMissionId={setExpandedMissionId}
                  submitting={submitting}
                  onJoin={handleJoinMission}
                  onSubmit={handleSubmitMission}
                  onApprove={handleApproveMission}
                  onRevise={handleReviseMission}
                />

              </div>

              <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-5">
                <div
                  className="rounded-2xl border border-border overflow-hidden animate-fade-up"
                  style={{ backgroundColor: "#1e1a2e", animationDelay: "240ms" }}
                >
                  <div className="h-[3px] w-full" style={{ backgroundColor: metrics.activeMeta.color }} />
                  <div className="p-4 sm:p-5">
                    <PathJourneySidebar
                      teamId={activeTab}
                      teamColor={metrics.activeMeta.color}
                      leadTitle={metrics.activeMeta.leadTitle}
                      completions={completions}
                      allQuests={quests}
                    />
                  </div>
                </div>
                <QuestBadgesCard
                  teamColor={metrics.activeMeta.color}
                  completions={completions}
                  allQuests={quests}
                  teams={userData!.teams ?? []}
                  xp={userData!.xp ?? 0}
                  eventCount={eventCount}
                  reflectionCount={reflectionCount}
                  profileSetupCount={profileSetupCount}
                />
              </div>
            </>
          )}

        </div>
      </div>
    </PageShell>
  );
}

export default function QuestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base flex items-center justify-center">
          <p className="text-text-secondary text-sm font-sans">Loading quests…</p>
        </div>
      }
    >
      <QuestsPageContent />
    </Suspense>
  );
}
