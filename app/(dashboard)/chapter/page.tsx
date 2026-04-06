"use client";

import { useMemo, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { ChapterHero } from "@/components/chapter/ChapterHero";
import { ChapterStatsCards } from "@/components/chapter/ChapterStatsCards";
import { CoordinatorsSection } from "@/components/chapter/CoordinatorsSection";
import { ChapterRecentEventsSection } from "@/components/chapter/ChapterRecentEventsSection";
import { ChapterVolunteersSection } from "@/components/chapter/ChapterVolunteersSection";
import { ChapterLeaderboardPanel } from "@/components/chapter/ChapterLeaderboardPanel";
import { ChapterTeamBreakdown } from "@/components/chapter/ChapterTeamBreakdown";
import { ChapterSkeleton } from "@/components/chapter/ChapterSkeleton";
import { ChapterSwitcherDropdown } from "@/components/chapter/ChapterSwitcherDropdown";
import { EditChapterInfoModal } from "@/components/chapter/EditChapterInfoModal";
import { useChapterSession } from "@/hooks/useChapterSession";
import { useChapterData } from "@/hooks/useChapterData";
import { useChapterVolunteersUI } from "@/hooks/useChapterVolunteersUI";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";

export default function ChapterPage() {
  const { authChecked, currentUser, viewingChapterId, setViewingChapterId } = useChapterSession();
  const {
    loadingChapter,
    volunteers,
    events,
    regCounts,
    totalVolunteerXP,
  } = useChapterData(viewingChapterId);

  const [showEditModal, setShowEditModal] = useState(false);

  const coordinators = useMemo(
    () => volunteers.filter((v) => v.role === "coordinator"),
    [volunteers]
  );

  const leaderboard = useMemo(
    () => volunteers.filter((v) => v.role === "volunteer").sort((a, b) => b.xp - a.xp),
    [volunteers]
  );

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
  } = useChapterVolunteersUI(leaderboard, viewingChapterId);

  const isOwnChapter = currentUser?.chapterId === viewingChapterId;
  const canEdit = Boolean(isOwnChapter && currentUser?.role === "coordinator");

  const avatarUrl = currentUser
    ? buildAvatarUrl(currentUser.username, currentUser.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  return (
    <PageShell
      title="Chapter"
      avatarUrl={avatarUrl}
      loading={!authChecked || loadingChapter}
      skeleton={<ChapterSkeleton />}
      actions={
        authChecked ? (
          <ChapterSwitcherDropdown
            currentUser={currentUser}
            viewingChapterId={viewingChapterId}
            setViewingChapterId={setViewingChapterId}
          />
        ) : undefined
      }
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-6 items-stretch lg:items-start pb-10">

          <div className="lg:col-span-3">
            <ChapterHero
              chapterId={viewingChapterId}
              canEdit={canEdit}
              onEdit={() => setShowEditModal(true)}
            />
          </div>

          <div className="lg:col-span-3">
            <ChapterStatsCards
              eventCount={events.length}
              volunteerCount={leaderboard.length}
              totalXP={totalVolunteerXP}
            />
          </div>

          <div className="contents lg:flex lg:flex-col gap-6 lg:col-span-2">

            {coordinators.length > 0 && (
              <div className="order-3 lg:order-none">
                <CoordinatorsSection coordinators={coordinators} />
              </div>
            )}

            <ChapterRecentEventsSection events={events} regCounts={regCounts} />

            <ChapterVolunteersSection
              volunteers={leaderboard}
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
              currentUserId={currentUser?.uid}
            />

          </div>

          <div className="contents lg:flex lg:flex-col gap-6 lg:col-start-3 lg:col-span-1">

            <ChapterLeaderboardPanel
              viewingChapterId={viewingChapterId}
              leaderboard={leaderboard}
              currentUserId={currentUser?.uid}
            />

            <ChapterTeamBreakdown volunteers={leaderboard} />

          </div>

        </div>
      </div>

      <EditChapterInfoModal open={showEditModal} onClose={() => setShowEditModal(false)} />
    </PageShell>
  );
}
