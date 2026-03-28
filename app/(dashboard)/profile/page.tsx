"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { useQuestData } from "@/hooks/useQuestData";
import { useXpActivityLog } from "@/hooks/useXpActivityLog";
import { useShareLinkCopy } from "@/hooks/useShareLinkCopy";
import { buildVolunteerBadgeList } from "@/lib/volunteerBadges";
import { generateVolunteerProfileResume } from "@/lib/profileResume";
import PageShell from "@/components/layout/PageShell";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfilePortfolioCard } from "@/components/profile/ProfilePortfolioCard";
import { ProfileMilestonesSection } from "@/components/profile/ProfileMilestonesSection";
import { ProfileActivityFeed } from "@/components/profile/ProfileActivityFeed";
import { ProfileBadgesGrid } from "@/components/profile/ProfileBadgesGrid";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import type { ProfilePageUser } from "@/components/profile/types";

export default function ProfilePage() {
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
    };
  }, [sessionUser]);

  const firebaseUid = sessionUser?.uid ?? "";
  const [activeTeam, setActiveTeam] = useState("");
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const { copied, copyUrl } = useShareLinkCopy();

  const chapterId = userData?.chapterId ?? "";
  // Also loads missions (shared hook with /quests); keeps profile data in sync with quest progress.
  const {
    quests: allQuests,
    completions,
    reflectionCount,
    eventCount,
    profileSetupCount,
    loadingQuests,
  } = useQuestData(firebaseUid, chapterId);

  const { rawEntries: xpLogRaw, loading: xpLogLoading, hasMore: activityHasMore } =
    useXpActivityLog(firebaseUid);

  useEffect(() => {
    const t = userData?.teams ?? [];
    if (t.length > 0) setActiveTeam((prev) => (prev && t.includes(prev) ? prev : t[0]));
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

  const activityEntries = xpLogRaw.slice(0, 20);
  const loading = loadingQuests || xpLogLoading;

  function handleCopyShare() {
    if (!userData || typeof window === "undefined") return;
    copyUrl(`${window.location.origin}/profile/${userData.username}`);
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
        },
        completions,
        allQuests,
        badges,
        xpLogRaw,
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

  return (
    <PageShell
      title="Profile"
      avatarUrl={avatarUrl}
      loading={loading}
      skeleton={<ProfileSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:items-start pb-10">
          <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-2">
            <div className="order-1 lg:order-none animate-fade-up" style={{ animationDelay: "0ms" }}>
              <ProfileHeaderCard
                userData={userData}
                avatarUrl={avatarUrl}
                onGenerateResume={handleGenerateResume}
                isGeneratingResume={isGeneratingResume}
                onCopyShare={handleCopyShare}
                copied={copied}
              />
            </div>
            <div className="order-4 lg:order-none animate-fade-up" style={{ animationDelay: "180ms" }}>
              <ProfileBadgesGrid badges={badges} />
            </div>
            <div className="order-5 lg:order-none animate-fade-up" style={{ animationDelay: "240ms" }}>
              <ProfileActivityFeed entries={activityEntries} hasMore={activityHasMore} />
            </div>
          </div>
          <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-1">
            <div className="order-2 lg:order-none animate-fade-up" style={{ animationDelay: "60ms" }}>
              <ProfilePortfolioCard
                completions={completions}
                allQuests={allQuests}
                eventCount={eventCount}
                reflectionCount={reflectionCount}
                badgesEarned={badgesEarned}
                onCopyShare={handleCopyShare}
                copied={copied}
              />
            </div>
            {milestoneTeam ? (
              <div className="order-3 lg:order-none animate-fade-up" style={{ animationDelay: "120ms" }}>
                <ProfileMilestonesSection
                  userData={userData}
                  completions={completions}
                  allQuests={allQuests}
                  activeTeam={milestoneTeam}
                  onTeamChange={setActiveTeam}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
