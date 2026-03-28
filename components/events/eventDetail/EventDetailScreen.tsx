"use client";

import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import {
  formatEventDate,
  formatEventTime,
  hoursUntil,
  isEventUpcoming,
} from "@/lib/events/eventDetailFormat";
import { useEventDetailPage } from "@/hooks/useEventDetailPage";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { CoordinatorEventDetail } from "./CoordinatorEventDetail";
import { VolunteerEventDetail } from "./VolunteerEventDetail";
import { EventDetailPageShellSkeleton, EventDetailLoadingBar } from "./EventDetailSkeleton";

export function EventDetailScreen({ eventId }: { eventId: string }) {
  const { ready, loading: authLoading } = useRequireDashboardAuth();
  const p = useEventDetailPage(eventId);

  if (authLoading || !ready) {
    return <EventDetailPageShellSkeleton />;
  }

  if (!p.authReady || !p.userData) {
    return <EventDetailPageShellSkeleton />;
  }

  if (p.dataLoading || !p.event) {
    return <EventDetailLoadingBar />;
  }

  const event = p.event;
  const userData = p.userData;
  const upcoming = isEventUpcoming(event.date);
  const totalSlots = event.roles.reduce((s, r) => s + r.slots, 0);
  const totalFilled = Object.values(p.slotCounts).reduce((s, c) => s + c, 0);
  const confirmed = p.allRegs.filter((r) => r.attended).length;
  const reflections = p.allRegs.filter((r) => r.reflectionSubmitted).length;
  const timeLabel = (() => {
    const start = formatEventTime(event.date);
    const end = event.endDate ? ` – ${formatEventTime(event.endDate)}` : "";
    return `${start}${end}`;
  })();

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);
  const isCoord = userData.role === "coordinator";

  const joined = !!p.myReg;
  const attended = p.myReg?.attended ?? false;
  const reflectionSubmitted = p.myReg?.reflectionSubmitted ?? false;
  const reflectionDeadline = p.myReg?.reflectionDeadline;
  const reflectionOpen =
    attended &&
    !reflectionSubmitted &&
    !!reflectionDeadline &&
    reflectionDeadline.toDate() > new Date();
  const hoursLeft = reflectionDeadline ? hoursUntil(reflectionDeadline) : 0;

  if (isCoord) {
    return (
      <CoordinatorEventDetail
        event={event}
        allRegs={p.allRegs}
        slotCounts={p.slotCounts}
        coordTab={p.coordTab}
        setCoordTab={p.setCoordTab}
        roleFilter={p.roleFilter}
        setRoleFilter={p.setRoleFilter}
        confirmingId={p.confirmingId}
        confirmingAll={p.confirmingAll}
        scanFeedback={p.scanFeedback}
        showQrScanner={p.showQrScanner}
        setShowQrScanner={p.setShowQrScanner}
        showEditModal={p.showEditModal}
        setShowEditModal={p.setShowEditModal}
        saving={p.saving}
        showDeleteConfirm={p.showDeleteConfirm}
        setShowDeleteConfirm={p.setShowDeleteConfirm}
        deleting={p.deleting}
        onSaveEdit={p.handleSaveEdit}
        onDelete={p.handleDelete}
        onExportCsv={p.exportCsv}
        onConfirmAttendance={p.confirmAttendance}
        onConfirmAll={p.confirmAll}
        onQrScan={p.handleQrScan}
        avatarUrl={avatarUrl}
        upcoming={upcoming}
        totalSlots={totalSlots}
        totalFilled={totalFilled}
        confirmed={confirmed}
        reflections={reflections}
        timeLabel={timeLabel}
        formatDate={formatEventDate}
      />
    );
  }

  return (
    <VolunteerEventDetail
      event={event}
      eventId={p.eventId}
      slotCounts={p.slotCounts}
      myReg={p.myReg}
      publicRegs={p.publicRegs}
      firebaseUser={p.firebaseUser}
      avatarUrl={avatarUrl}
      upcoming={upcoming}
      totalSlots={totalSlots}
      totalFilled={totalFilled}
      timeLabel={timeLabel}
      formatDate={formatEventDate}
      joined={joined}
      attended={attended}
      reflectionSubmitted={reflectionSubmitted}
      reflectionOpen={reflectionOpen}
      hoursLeft={hoursLeft}
      showRoleModal={p.showRoleModal}
      setShowRoleModal={p.setShowRoleModal}
      joiningLoading={p.joiningLoading}
      onJoin={p.handleJoin}
    />
  );
}
