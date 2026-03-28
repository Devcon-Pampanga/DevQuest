"use client";

import { useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
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
import { RemoveVolunteerModal } from "@/components/chapter/RemoveVolunteerModal";
import { useChapterSession } from "@/hooks/useChapterSession";
import { useChapterData } from "@/hooks/useChapterData";
import { useChapterVolunteersUI } from "@/hooks/useChapterVolunteersUI";
import { db } from "@/lib/firebase";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";

export default function ChapterPage() {
  const { authChecked, currentUser, viewingChapterId, setViewingChapterId } = useChapterSession();
  const {
    loadingChapter,
    volunteers,
    setVolunteers,
    events,
    regCounts,
  } = useChapterData(viewingChapterId);

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
  } = useChapterVolunteersUI(volunteers, viewingChapterId);

  const [showEditModal, setShowEditModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ uid: string; username: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  const coordinators = useMemo(
    () => volunteers.filter((v) => v.role === "coordinator"),
    [volunteers]
  );

  const totalAttendees = useMemo(
    () => Object.values(regCounts).reduce((s, c) => s + c, 0),
    [regCounts]
  );

  const leaderboard = useMemo(
    () => [...volunteers].sort((a, b) => b.xp - a.xp),
    [volunteers]
  );

  const isOwnChapter = currentUser?.chapterId === viewingChapterId;
  const canEdit = Boolean(isOwnChapter && currentUser?.role === "coordinator");

  const avatarUrl = currentUser
    ? buildAvatarUrl(currentUser.username, currentUser.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  async function handleRemoveVolunteer() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await updateDoc(doc(db, "users", removeTarget.uid), { chapterId: "" });
      setVolunteers((prev) => prev.filter((v) => v.uid !== removeTarget.uid));
      setRemoveTarget(null);
    } catch (err) {
      console.error("Failed to remove volunteer:", err);
    } finally {
      setRemoving(false);
    }
  }

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
              volunteerCount={volunteers.length}
              totalAttendees={totalAttendees}
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
              canEdit={canEdit}
              currentUserId={currentUser?.uid}
              onRequestRemoveVolunteer={(uid) => {
                const vol = volunteers.find((vv) => vv.uid === uid);
                if (vol) setRemoveTarget({ uid, username: vol.username });
              }}
            />

          </div>

          <div className="contents lg:flex lg:flex-col gap-6 lg:col-start-3 lg:col-span-1">

            <ChapterLeaderboardPanel
              viewingChapterId={viewingChapterId}
              leaderboard={leaderboard}
              currentUserId={currentUser?.uid}
            />

            <ChapterTeamBreakdown volunteers={volunteers} />

          </div>

        </div>
      </div>

      <EditChapterInfoModal open={showEditModal} onClose={() => setShowEditModal(false)} />

      <RemoveVolunteerModal
        target={removeTarget}
        removing={removing}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemoveVolunteer}
      />
    </PageShell>
  );
}
