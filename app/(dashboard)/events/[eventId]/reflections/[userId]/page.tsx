"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, getDocs, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_AVATAR, buildAvatarUrl, type AvatarOptions } from "@/lib/avatar";
import { TEAM_META } from "@/lib/seed/quests";
import { useQuestData } from "@/hooks/useQuestData";
import { useXpActivityLog } from "@/hooks/useXpActivityLog";
import { useLeaderboardVolunteers } from "@/hooks/useLeaderboardVolunteers";
import { buildVolunteerBadgeList } from "@/lib/volunteerBadges";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileStatCards } from "@/components/profile/ProfileStatCards";
import { ProfileMilestonesSection } from "@/components/profile/ProfileMilestonesSection";
import { ProfileActivityFeed } from "@/components/profile/ProfileActivityFeed";
import { ChapterLeaderboardPanel } from "@/components/chapter/ChapterLeaderboardPanel";
import { ProfileBadgesGrid } from "@/components/profile/ProfileBadgesGrid";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import type { EventDoc, EventRegistration, ReflectionRatingKey } from "@/lib/events/types";
import type { ProfilePageUser } from "@/components/profile/types";

const LIKERT_QUESTIONS: { key: ReflectionRatingKey; label: string; section: "pre" | "during" }[] = [
  { key: "q1", label: "My volunteer role(s) were clearly stated", section: "pre" },
  { key: "q2", label: "Reporting instructions were clearly stated", section: "pre" },
  { key: "q3", label: "Reporting instructions were complete", section: "pre" },
  { key: "q4", label: "I received enough materials and support", section: "pre" },
  { key: "q5", label: "I felt overwhelmed during the event", section: "during" },
  { key: "q6", label: "My work was essential to the event's success", section: "during" },
  { key: "q7", label: "I was given enough time for my tasks", section: "during" },
  { key: "q8", label: "I had access to help when I needed it", section: "during" },
];

const MOOD_EMOJI: Record<string, string> = {
  drained: "🥱",
  okay: "🙂",
  good: "😊",
  energized: "🔥",
};

const MOOD_COLOR: Record<string, string> = {
  drained: "bg-red-500/15 text-red-400 border-red-500/30",
  okay: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  good: "bg-team-sustainability/15 text-team-sustainability border-team-sustainability/30",
  energized: "bg-accent-highlight/15 text-accent-highlight border-accent-highlight/30",
};

export default function ReflectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const targetUserId = params.userId as string;
  const { ready } = useRequireDashboardAuth();
  const { user } = useAuth();

  // Phase 1 — direct Firestore reads
  const [volunteerUser, setVolunteerUser] = useState<ProfilePageUser | null>(null);
  const [volunteerChapterId, setVolunteerChapterId] = useState("");
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [reg, setReg] = useState<EventRegistration | null>(null);
  const [starsReceived, setStarsReceived] = useState(0);
  const [phase1Loading, setPhase1Loading] = useState(true);
  const [activeTeam, setActiveTeam] = useState("");

  useEffect(() => {
    if (!ready || !user) return;

    if (user.role !== "coordinator") {
      router.replace(`/events/${eventId}`);
      return;
    }

    async function load() {
      try {
        const [userSnap, eventSnap, regSnap, allRegsSnap] = await Promise.all([
          getDoc(doc(db, "users", targetUserId)),
          getDoc(doc(db, "events", eventId)),
          getDoc(doc(db, "events", eventId, "registrations", targetUserId)),
          getDocs(collection(db, "events", eventId, "registrations")),
        ]);

        if (!eventSnap.exists() || !regSnap.exists()) {
          router.replace(`/events/${eventId}`);
          return;
        }

        setEvent({ eventId, ...eventSnap.data() } as EventDoc);
        setReg(regSnap.data() as EventRegistration);

        const stars = allRegsSnap.docs.filter((d) =>
          (d.data() as EventRegistration).starsGiven?.includes(targetUserId)
        ).length;
        setStarsReceived(stars);

        if (userSnap.exists()) {
          const raw = userSnap.data() as Record<string, unknown>;
          const chapterId = typeof raw.chapterId === "string" ? raw.chapterId : "";
          const teams = Array.isArray(raw.teams) ? (raw.teams as string[]) : [];

          const profileUser: ProfilePageUser = {
            uid: targetUserId,
            username: typeof raw.username === "string" ? raw.username : "",
            // email intentionally omitted — coordinator must not see volunteer's email
            role: raw.role === "coordinator" ? "coordinator" : "volunteer",
            chapterId,
            teams,
            xp: typeof raw.xp === "number" ? raw.xp : 0,
            contactNumber: "", // privacy: coordinator must not see contact number
            linkedinUrl: typeof raw.linkedinUrl === "string" ? raw.linkedinUrl : undefined,
            githubUrl: typeof raw.githubUrl === "string" ? raw.githubUrl : undefined,
            createdAt: raw.createdAt as Timestamp | undefined,
            avatarOptions: raw.avatarOptions as AvatarOptions | undefined,
            onboardingComplete: raw.onboardingComplete === true,
            devCoins: typeof raw.devCoins === "number" ? raw.devCoins : 0,
          };

          setVolunteerUser(profileUser);
          setVolunteerChapterId(chapterId);
          setActiveTeam(teams[0] ?? "");
        }
      } finally {
        setPhase1Loading(false);
      }
    }

    void load();
  }, [ready, user, eventId, targetUserId, router]);

  // Phase 2 — hooks (enabled once chapterId is known after Phase 1)
  const { quests: allQuests, completions, reflectionCount, eventCount, profileSetupCount, loadingQuests } =
    useQuestData(targetUserId, volunteerChapterId);

  const { rawEntries: xpLogRaw, loading: xpLogLoading, hasMore: activityHasMore } =
    useXpActivityLog(targetUserId);

  const { volunteers: leaderboardVolunteers } = useLeaderboardVolunteers(volunteerChapterId);

  // Derived values
  const completedQuestCount = useMemo(
    () => Object.values(completions).filter((c) => c.status === "completed").length,
    [completions]
  );

  const badges = useMemo(() => {
    if (!volunteerUser) return [];
    return buildVolunteerBadgeList({
      teams: volunteerUser.teams,
      completions,
      allQuests,
      eventCount,
      reflectionCount,
      completedQuestCount,
      profileSetupCount,
      xp: volunteerUser.xp,
    });
  }, [volunteerUser, completions, allQuests, eventCount, reflectionCount, completedQuestCount, profileSetupCount]);

  const badgesEarned = useMemo(() => badges.filter((b) => b.earned).length, [badges]);

  const leaderboard = useMemo(
    () => [...leaderboardVolunteers].sort((a, b) => b.xp - a.xp),
    [leaderboardVolunteers]
  );

  const activityEntries = xpLogRaw.slice(0, 20);
  const coordinatorAvatarUrl = buildAvatarUrl(user?.username ?? "", user?.avatarOptions ?? DEFAULT_AVATAR);
  const isLoading = phase1Loading || !ready || loadingQuests || xpLogLoading;

  // — Skeleton —
  if (isLoading || !volunteerUser || !event || !reg) {
    return (
      <div className="min-h-screen bg-base pb-16">
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface animate-pulse" />
            <div className="h-6 w-36 rounded-lg bg-surface animate-pulse" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-surface animate-pulse" />
        </div>
        <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  const { reflectionData } = reg;
  const teams = volunteerUser.teams;
  const milestoneTeam = activeTeam && teams.includes(activeTeam) ? activeTeam : teams[0] ?? "";
  const primaryTeamColor = teams[0] && TEAM_META[teams[0]] ? TEAM_META[teams[0]].color : "#A855F7";
  const avatarUrl = buildAvatarUrl(volunteerUser.username, volunteerUser.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div className="min-h-screen bg-base pb-16">
      {/* Topbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/events/${eventId}`}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-heading text-xl text-text-primary tracking-wide truncate min-w-0">
            {volunteerUser.username}
          </h1>
        </div>
        <Link href="/dashboard" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coordinatorAvatarUrl}
            alt="Profile"
            width={36}
            height={36}
            className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors"
          />
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:gap-6 items-stretch lg:items-start pb-10">

          {/* Full width: ProfileHeaderCard */}
          <div className="lg:col-span-3">
            <ProfileHeaderCard
              userData={volunteerUser}
              avatarUrl={avatarUrl}
              showEmail={false}
              showSettingsLink={false}
              showDevCoins={false}
            />
          </div>

          {/* Full width: stat cards */}
          <div className="lg:col-span-3">
            <ProfileStatCards
              eventCount={eventCount}
              badgesEarned={badgesEarned}
              starsReceived={starsReceived}
            />
          </div>

          {/* Left 2/3: milestones + activity */}
          <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-2 order-3 lg:order-none">
            {milestoneTeam ? (
              <ProfileMilestonesSection
                userData={volunteerUser}
                completions={completions}
                allQuests={allQuests}
                activeTeam={milestoneTeam}
                onTeamChange={setActiveTeam}
              />
            ) : null}
            <ProfileActivityFeed entries={activityEntries} hasMore={activityHasMore} />
          </div>

          {/* Right 1/3: leaderboard + badges */}
          <div className="flex flex-col gap-5 lg:gap-6 lg:col-span-1 order-2 lg:order-none">
            <ChapterLeaderboardPanel
              viewingChapterId={volunteerChapterId}
              leaderboard={leaderboard}
              currentUserId={targetUserId}
              displayLimit={3}
              showCurrentUserOutsideLimit
            />
            <ProfileBadgesGrid badges={badges} teamColor={primaryTeamColor} />
          </div>

          {/* Full width: Post-Event Reflection */}
          <div className="lg:col-span-3 order-4 lg:order-none">
            {!reflectionData ? (
              <div className="rounded-2xl bg-surface border border-border p-8 text-center">
                <p className="text-text-muted text-sm">This volunteer has not submitted a reflection yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="font-heading text-lg text-text-primary">Post-Event Reflection</h2>
                  <div className="flex items-center gap-2">
                    {starsReceived > 0 && (
                      <div className="px-3 py-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 text-sm font-medium flex items-center gap-1.5">
                        <span>⭐</span>
                        <span>{starsReceived}</span>
                      </div>
                    )}
                    <div className={`px-3 py-1.5 rounded-full border text-sm font-medium flex items-center gap-1.5 ${MOOD_COLOR[reflectionData.mood] ?? "bg-surface text-text-muted border-border"}`}>
                      <span>{MOOD_EMOJI[reflectionData.mood] ?? "—"}</span>
                      <span className="capitalize">{reflectionData.mood}</span>
                    </div>
                  </div>
                </div>

                {reflectionData.submittedAt && (
                  <p className="text-xs text-text-muted text-right -mt-2">
                    Submitted{" "}
                    {reflectionData.submittedAt.toDate().toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}

                {/* Pre-event ratings */}
                <div className="rounded-2xl bg-surface border border-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent-highlight shrink-0" />
                    <h3 className="font-heading text-sm text-text-muted uppercase tracking-wider">Pre-Event Preparation</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {LIKERT_QUESTIONS.filter((q) => q.section === "pre").map((q) => {
                      const val = reflectionData.ratings[q.key];
                      return (
                        <div key={q.key} className="px-5 py-4 flex items-center gap-4">
                          <p className="text-sm text-text-secondary flex-1 leading-relaxed">{q.label}</p>
                          <div className="flex gap-1.5 shrink-0">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <div
                                key={v}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-heading font-medium ${
                                  v === val
                                    ? "bg-accent-highlight text-white"
                                    : "bg-base border border-border text-text-muted"
                                }`}
                              >
                                {v}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* During-event ratings */}
                <div className="rounded-2xl bg-surface border border-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-team-community shrink-0" />
                    <h3 className="font-heading text-sm text-text-muted uppercase tracking-wider">During the Event</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {LIKERT_QUESTIONS.filter((q) => q.section === "during").map((q) => {
                      const val = reflectionData.ratings[q.key];
                      return (
                        <div key={q.key} className="px-5 py-4 flex items-center gap-4">
                          <p className="text-sm text-text-secondary flex-1 leading-relaxed">{q.label}</p>
                          <div className="flex gap-1.5 shrink-0">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <div
                                key={v}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-heading font-medium ${
                                  v === val
                                    ? "bg-team-community text-white"
                                    : "bg-base border border-border text-text-muted"
                                }`}
                              >
                                {v}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Insights */}
                {reflectionData.insights && (
                  <div className="rounded-2xl bg-surface border border-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                      <h3 className="font-heading text-sm text-text-muted uppercase tracking-wider">Insights &amp; Suggestions</h3>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-text-secondary leading-relaxed italic">
                        &ldquo;{reflectionData.insights}&rdquo;
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
