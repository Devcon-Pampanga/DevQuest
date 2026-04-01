"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { TEAM_META } from "@/lib/seed/quests";
import { useQuestData } from "@/hooks/useQuestData";
import { useXpActivityLog } from "@/hooks/useXpActivityLog";
import { useShareLinkCopy } from "@/hooks/useShareLinkCopy";
import { buildVolunteerBadgeList } from "@/lib/volunteerBadges";
import { generateVolunteerProfileResume } from "@/lib/profileResume";
import PageShell from "@/components/layout/PageShell";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileStatCards } from "@/components/profile/ProfileStatCards";
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
      title="Profile"
      avatarUrl={avatarUrl}
      loading={loading}
      skeleton={<ProfileSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:gap-6 items-stretch lg:items-start pb-10">

          {/* Full-width header */}
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

          {/* Full-width stat cards */}
          <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
            <ProfileStatCards eventCount={eventCount} badgesEarned={badgesEarned} />
          </div>

          {/* Left 2/3: milestones + activity */}
          <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-2">
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
            <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
              <ProfileActivityFeed entries={activityEntries} hasMore={activityHasMore} />
            </div>
          </div>

          {/* Right 1/3: badges */}
          <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-1">
            <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
              <ProfileBadgesGrid badges={badges} teamColor={primaryTeamColor} />
            </div>
          </div>

        </div>
      </div>
    </PageShell>
  );
}
