"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Timestamp } from "firebase/firestore";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import DashboardLayout from "@/app/(dashboard)/layout";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { useXpActivityLog } from "@/hooks/useXpActivityLog";
import { useLeaderboardVolunteers } from "@/hooks/useLeaderboardVolunteers";
import { useShareLinkCopy } from "@/hooks/useShareLinkCopy";
import type { DashboardProfilePayload, SerializedQuestCompletion } from "@/lib/profile/dashboardProfile";
import { TEAM_META } from "@/lib/seed/quests";
import { buildVolunteerBadgeList } from "@/lib/volunteerBadges";
import { generateVolunteerProfileResume } from "@/lib/profileResume";
import { ChapterLeaderboardPanel } from "@/components/chapter/ChapterLeaderboardPanel";
import { ProfileHeaderCard } from "./ProfileHeaderCard";
import { ProfileStatCards } from "./ProfileStatCards";
import { ProfileMilestonesSection } from "./ProfileMilestonesSection";
import { ProfileActivityFeed } from "./ProfileActivityFeed";
import { ProfileBadgesGrid } from "./ProfileBadgesGrid";
import type { QuestCompletion } from "@/types/quest";
import type { ProfilePageUser } from "./types";

function toTimestamp(ms?: number): Timestamp | undefined {
  return typeof ms === "number" ? Timestamp.fromMillis(ms) : undefined;
}

function deserializeCompletions(serialized: Record<string, SerializedQuestCompletion>) {
  const next: Record<string, QuestCompletion> = {};
  Object.entries(serialized).forEach(([questId, completion]) => {
    next[questId] = {
      ...completion,
      completedAt: toTimestamp(completion.completedAtMs),
    };
  });
  return next;
}

function MobileSidebarButton() {
  const { openSidebar } = useSidebar();

  return (
    <button
      type="button"
      onClick={openSidebar}
      className="lg:hidden rounded-xl p-2 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
      aria-label="Open sidebar"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}

function BackButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          window.history.back();
          return;
        }
        window.location.assign("/dashboard");
      }}
      className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
      aria-label="Go back"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
    </button>
  );
}

function TopBar({ username, avatarUrl }: { username: string; avatarUrl?: string }) {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-base/95 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebarButton />
        <BackButton />
        <div className="min-w-0">
          <h1 className="font-heading text-xl text-text-primary sm:text-2xl truncate">{username}</h1>
        </div>
      </div>

      <Link href="/dashboard" className="shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Your profile"
            width={36}
            height={36}
            className="rounded-xl border-2 border-border transition-colors hover:border-accent-highlight"
          />
        ) : (
          <div className="h-9 w-9 rounded-xl bg-surface" />
        )}
      </Link>
    </div>
  );
}

function ProfileDetailSkeleton() {
  return (
    <div className="flex-1 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-3xl lg:max-w-5xl flex flex-col gap-5">
        <div className="h-52 rounded-[28px] bg-surface/80 animate-pulse" />
        <div className="h-20 rounded-3xl bg-surface/70 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-72 rounded-3xl bg-surface/70 animate-pulse" />
          <div className="h-60 rounded-3xl bg-surface/70 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function DashboardProfileDetailContent({ payload }: { payload: DashboardProfilePayload }) {
  const { ready, loading } = useRequireDashboardAuth();
  const { user: sessionUser } = useAuth();

  const userData = useMemo<ProfilePageUser>(
    () => ({
      uid: payload.identity.uid,
      username: payload.identity.username,
      email: payload.identity.email,
      role: payload.identity.role,
      chapterId: payload.identity.chapterId,
      teams: payload.identity.teams,
      xp: payload.progression.xp,
      devCoins: payload.progression.devCoins,
      contactNumber: "",
      linkedinUrl: payload.socials.linkedinUrl,
      githubUrl: payload.socials.githubUrl,
      createdAt: toTimestamp(payload.identity.createdAtMs),
      avatarOptions: payload.identity.avatarOptions,
    }),
    [payload]
  );

  const completions = useMemo(() => deserializeCompletions(payload.completions), [payload.completions]);

  const completedQuestCount = useMemo(
    () => Object.values(completions).filter((c) => c.status === "completed").length,
    [completions]
  );

  const badges = useMemo(
    () =>
      buildVolunteerBadgeList({
        teams: userData.teams,
        completions,
        allQuests: payload.quests,
        eventCount: payload.eventCount,
        reflectionCount: payload.reflectionCount,
        completedQuestCount,
        profileSetupCount: payload.profileSetupCount,
        xp: userData.xp,
      }),
    [completedQuestCount, completions, payload.eventCount, payload.profileSetupCount, payload.quests, payload.reflectionCount, userData.teams, userData.xp]
  );

  const badgesEarned = useMemo(() => badges.filter((b) => b.earned).length, [badges]);

  const viewedAvatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);
  const sessionAvatarUrl = sessionUser
    ? buildAvatarUrl(sessionUser.username, sessionUser.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  const primaryTeamColor = userData.teams[0] && TEAM_META[userData.teams[0]] ? TEAM_META[userData.teams[0]].color : "#A855F7";

  const [activeTeam, setActiveTeam] = useState("");
  useEffect(() => {
    const teams = userData.teams ?? [];
    if (teams.length > 0) {
      setActiveTeam((prev) => (prev && teams.includes(prev) ? prev : teams[0]));
    }
  }, [userData.teams]);

  const chapterId = userData.chapterId ?? "";
  const { rawEntries: xpLogRaw, hasMore: activityHasMore } = useXpActivityLog(userData.uid);
  const { volunteers: leaderboardVolunteers } = useLeaderboardVolunteers(chapterId);

  const leaderboard = useMemo(
    () => [...leaderboardVolunteers].sort((a, b) => b.xp - a.xp),
    [leaderboardVolunteers]
  );

  const activityEntries = xpLogRaw.slice(0, 20);

  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const { copied, copyUrl } = useShareLinkCopy();

  function handleCopyShare() {
    if (typeof window === "undefined") return;
    copyUrl(`${window.location.origin}/profile/${userData.uid}`);
  }

  async function handleGenerateResume() {
    if (typeof window === "undefined") return;
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
        allQuests: payload.quests,
        badges,
        eventCount: payload.eventCount,
        reflectionCount: payload.reflectionCount,
        completedQuestCount,
        badgesEarned,
      });
    } finally {
      setIsGeneratingResume(false);
    }
  }

  const milestoneTeam = activeTeam && userData.teams.includes(activeTeam) ? activeTeam : userData.teams[0] ?? "";

  if (loading || !ready) {
    return (
      <>
        <TopBar username="" avatarUrl={sessionAvatarUrl} />
        <ProfileDetailSkeleton />
      </>
    );
  }

  return (
    <>
      <TopBar username={userData.username} avatarUrl={sessionAvatarUrl} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:gap-6 items-stretch lg:items-start pb-10">

          <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "0ms" }}>
            <ProfileHeaderCard
              userData={userData}
              avatarUrl={viewedAvatarUrl}
              onGenerateResume={handleGenerateResume}
              isGeneratingResume={isGeneratingResume}
              onCopyShare={handleCopyShare}
              copied={copied}
              showSettingsLink={false}
            />
          </div>

          <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
            <ProfileStatCards
              eventCount={payload.eventCount}
              badgesEarned={badgesEarned}
              starsReceived={payload.progression.starsReceived}
            />
          </div>

          <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-2 order-3 lg:order-none">
            {milestoneTeam ? (
              <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
                <ProfileMilestonesSection
                  userData={userData}
                  completions={completions}
                  allQuests={payload.quests}
                  activeTeam={milestoneTeam}
                  onTeamChange={setActiveTeam}
                />
              </div>
            ) : null}
            <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
              <ProfileActivityFeed entries={activityEntries} hasMore={activityHasMore} />
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-1 order-2 lg:order-none">
            <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
              <ChapterLeaderboardPanel
                viewingChapterId={chapterId}
                leaderboard={leaderboard}
                currentUserId={userData.uid}
                displayLimit={3}
                showCurrentUserOutsideLimit
              />
            </div>
            <div className="animate-fade-up" style={{ animationDelay: "210ms" }}>
              <ProfileBadgesGrid badges={badges} teamColor={primaryTeamColor} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export function DashboardProfileDetailPage({ payload }: { payload: DashboardProfilePayload }) {
  return (
    <DashboardLayout>
      <DashboardProfileDetailContent payload={payload} />
    </DashboardLayout>
  );
}
