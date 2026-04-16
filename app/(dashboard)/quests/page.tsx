"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { AvatarOptions, DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { useQuestData } from "@/hooks/useQuestData";
import { useQuestActions } from "@/hooks/useQuestActions";
import { useTeamQuestMetrics } from "@/hooks/useTeamQuestMetrics";
import { QuestTierSection } from "@/components/quests/QuestTierSection";
import { QuestFilterBar } from "@/components/quests/QuestFilterBar";
import { TeamQuestProgress } from "@/components/quests/TeamQuestProgress";
import { PathJourneySidebar } from "@/components/quests/PathJourneySidebar";
import { SubquestsPanel } from "@/components/quests/subquests/SubquestsPanel";
import { QuestsSkeleton } from "@/components/quests/QuestsSkeleton";
import { QuestBadgesCard } from "@/components/quests/QuestBadgesCard";
import PageShell from "@/components/layout/PageShell";
import { TEAM_META } from "@/lib/seed/quests";
import { ApprovalsQueueItem } from "@/types/quest";
import { SubquestApprovalItem } from "@/types/subquest";

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
  const router = useRouter();
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

  // Kept for useQuestActions type compatibility — volunteers don't populate these
  const [approvals, setApprovals] = useState<ApprovalsQueueItem[]>([]);
  const [missionApprovals, setMissionApprovals] = useState<SubquestApprovalItem[]>([]);

  const [activeTab, setActiveTab] = useState<string>("");
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.teams?.length) return;
    setActiveTab((prev) => (prev ? prev : userData.teams[0]));
  }, [userData]);

  const {
    submitting,
    handleSelfMark,
    handleSubmitApproval,
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

  useEffect(() => {
    if (!ready || !userData) return;
    if (userData.role === "coordinator") {
      router.replace("/dashboard");
    }
  }, [ready, router, userData]);

  if (ready && userData?.role === "coordinator") {
    return null;
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

          {!loadingCompletions && activeTab !== "approvals" && metrics && (
            <>
              {/* Left column — desktop col 1-2 */}
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

                {/* Your Journey — mobile only (position 2) */}
                <div
                  className="rounded-2xl border border-border overflow-hidden lg:hidden"
                  style={{ backgroundColor: "#1e1a2e" }}
                >
                  <div className="p-4 sm:p-5">
                    <PathJourneySidebar
                      teamId={activeTab}
                          leadTitle={metrics.activeMeta.leadTitle}
                      completions={completions}
                      allQuests={quests}
                    />
                  </div>
                </div>

                <QuestTierSection
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

                <SubquestsPanel
                  userData={userData!}
                  subquests={missions}
                  subquestCompletions={missionCompletions}
                  subquestApprovals={missionApprovals}
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

                {/* Badges — mobile only (position 5) */}
                <div className="lg:hidden [&_.animate-fade-up]:animate-none [&_.animate-fade-up]:opacity-100">
                  <QuestBadgesCard
                      completions={completions}
                    allQuests={quests}
                    teams={userData!.teams ?? []}
                    xp={userData!.xp ?? 0}
                    eventCount={eventCount}
                    reflectionCount={reflectionCount}
                    profileSetupCount={profileSetupCount}
                  />
                </div>

              </div>

              {/* Right sidebar — desktop only */}
              <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 sm:gap-5">
                <div
                  className="rounded-2xl border border-border overflow-hidden animate-fade-up"
                  style={{ backgroundColor: "#1e1a2e", animationDelay: "240ms" }}
                >
                  <div className="p-4 sm:p-5">
                    <PathJourneySidebar
                      teamId={activeTab}
                          leadTitle={metrics.activeMeta.leadTitle}
                      completions={completions}
                      allQuests={quests}
                    />
                  </div>
                </div>
                <QuestBadgesCard
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
