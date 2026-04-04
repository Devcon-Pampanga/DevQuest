"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { TEAM_META } from "@/lib/seed/quests";
import { buildVolunteerBadgeList } from "@/lib/volunteerBadges";
import { ChapterLeaderboardPanel } from "@/components/chapter/ChapterLeaderboardPanel";
import { ProfileActivityFeed } from "@/components/profile/ProfileActivityFeed";
import { ProfileBadgesGrid } from "@/components/profile/ProfileBadgesGrid";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileMilestonesSection } from "@/components/profile/ProfileMilestonesSection";
import { ProfileStatCards } from "@/components/profile/ProfileStatCards";
import type { PublicProfilePayload } from "@/lib/profile/publicProfile";
import type { ProfilePageUser } from "@/components/profile/types";
import type { QuestCompletion } from "@/types/quest";
import type { XPLogEntry } from "@/types/xp";

function toTimestamp(ms?: number): Timestamp | undefined {
  return typeof ms === "number" ? Timestamp.fromMillis(ms) : undefined;
}

export function PublicProfilePage({ payload }: { payload: PublicProfilePayload }) {
  const [activeTeam, setActiveTeam] = useState(payload.user.teams[0] ?? "");

  const userData = useMemo<ProfilePageUser>(
    () => ({
      uid: payload.user.uid,
      username: payload.user.username,
      role: payload.user.role,
      chapterId: payload.user.chapterId,
      teams: payload.user.teams,
      xp: payload.user.xp,
      linkedinUrl: payload.user.linkedinUrl,
      githubUrl: payload.user.githubUrl,
      createdAt: toTimestamp(payload.user.createdAtMs),
      avatarOptions: payload.user.avatarOptions,
      contactNumber: "",
    }),
    [payload.user]
  );

  const completions = useMemo(() => {
    const next: Record<string, QuestCompletion> = {};
    Object.entries(payload.completions).forEach(([questId, completion]) => {
      next[questId] = {
        ...completion,
        completedAt: toTimestamp(completion.completedAtMs),
      };
    });
    return next;
  }, [payload.completions]);

  const activityEntries = useMemo<XPLogEntry[]>(
    () =>
      payload.activityEntries.map((entry) => ({
        ...entry,
        createdAt: toTimestamp(entry.createdAtMs),
      })),
    [payload.activityEntries]
  );

  const completedQuestCount = useMemo(
    () => Object.values(completions).filter((completion) => completion.status === "completed").length,
    [completions]
  );

  const badges = useMemo(
    () =>
      buildVolunteerBadgeList({
        teams: userData.teams ?? [],
        completions,
        allQuests: payload.quests,
        eventCount: payload.eventCount,
        reflectionCount: payload.reflectionCount,
        completedQuestCount,
        profileSetupCount: payload.profileSetupCount,
        xp: userData.xp ?? 0,
      }),
    [completedQuestCount, completions, payload.eventCount, payload.profileSetupCount, payload.quests, payload.reflectionCount, userData.teams, userData.xp]
  );

  const badgesEarned = useMemo(() => badges.filter((badge) => badge.earned).length, [badges]);
  const leaderboard = useMemo(
    () => [...payload.leaderboard].sort((a, b) => b.xp - a.xp),
    [payload.leaderboard]
  );

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);
  const primaryTeamColor = userData.teams[0] && TEAM_META[userData.teams[0]] ? TEAM_META[userData.teams[0]].color : "#A855F7";
  const milestoneTeam = activeTeam && userData.teams.includes(activeTeam) ? activeTeam : userData.teams[0] ?? "";

  return (
    <main
      className="min-h-screen bg-base text-text-primary"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 20% 10%, rgba(124,58,237,0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168,85,247,0.10) 0%, transparent 50%)",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-highlight font-sans">Public Profile</p>
            <h1 className="font-heading text-3xl text-white sm:text-4xl">Volunteer journey, visible by design</h1>
            <p className="max-w-2xl text-sm text-text-secondary font-sans">
              DevQuest turns community work into milestones worth sharing. This public view highlights progress without exposing private account details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent-primary/50 hover:text-text-primary"
            >
              Back to home
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-accent-highlight px-4 py-2 text-sm font-heading text-white transition-colors hover:bg-accent-primary"
            >
              Open dashboard
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-10 lg:max-w-5xl lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-3">
            <ProfileHeaderCard
              userData={userData}
              avatarUrl={avatarUrl}
              showSettingsLink={false}
              showEmail={false}
              showDevCoins={false}
            />
          </div>

          <div className="lg:col-span-3">
            <ProfileStatCards eventCount={payload.eventCount} badgesEarned={badgesEarned} />
          </div>

          <div className="order-3 flex flex-col gap-5 lg:order-none lg:col-span-2 lg:gap-6">
            {milestoneTeam ? (
              <ProfileMilestonesSection
                userData={userData}
                completions={completions}
                allQuests={payload.quests}
                activeTeam={milestoneTeam}
                onTeamChange={setActiveTeam}
              />
            ) : null}

            <ProfileActivityFeed entries={activityEntries} hasMore={payload.hasMoreActivity} />
          </div>

          <div className="order-2 flex flex-col gap-5 lg:order-none lg:col-span-1 lg:gap-6">
            <ChapterLeaderboardPanel
              viewingChapterId={userData.chapterId}
              leaderboard={leaderboard}
              currentUserId={userData.uid}
              displayLimit={3}
              showCurrentUserOutsideLimit
            />
            <ProfileBadgesGrid badges={badges} teamColor={primaryTeamColor} />
          </div>
        </div>
      </div>
    </main>
  );
}
