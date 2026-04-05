"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Quest } from "@/types/quest";
import type { EventDoc, EventRegistration, EventRole, PublicRegistrationRow, EditEventFields } from "@/lib/events/types";
import {
  fetchEventDoc,
  fetchMyRegistration,
  fetchAllRegistrations,
  buildSlotCounts,
  enrichRegistrationsForCoordinator,
  buildPublicRegistrationList,
  fetchAllQuestDefinitions,
} from "@/lib/events/eventDetailData";
import { createEventRegistration, updateEventFromEditFields, deleteEventAndBanner } from "@/lib/events/eventMutations";
import { confirmVolunteerAttendance } from "@/lib/events/attendanceConfirmation";
import { parseAttendanceQrData, isDevQuestQr } from "@/lib/events/qrAttendance";
import { exportVolunteersCsv } from "@/lib/events/exportVolunteerCsv";

export type CoordTab = "details" | "volunteers" | "reflections";

export function useEventDetailPage(eventId: string) {
  const router = useRouter();
  const { status, firebaseUser, user: sessionUser } = useAuth();

  const userData = useMemo(() => {
    if (!sessionUser || sessionUser.onboardingComplete !== true) return null;
    return {
      uid: sessionUser.uid,
      username: sessionUser.username,
      role: sessionUser.role,
      chapterId: sessionUser.chapterId,
      xp: sessionUser.xp,
      avatarOptions: sessionUser.avatarOptions,
    };
  }, [sessionUser]);

  const [event, setEvent] = useState<EventDoc | null>(null);
  const [myReg, setMyReg] = useState<EventRegistration | null>(null);
  const [allRegs, setAllRegs] = useState<EventRegistration[]>([]);
  const [publicRegs, setPublicRegs] = useState<PublicRegistrationRow[]>([]);
  const [eventQuests, setEventQuests] = useState<Quest[]>([]);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(true);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [coordTab, setCoordTab] = useState<CoordTab>("details");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const authReady =
    status === "ready" && !!firebaseUser && !!userData;

  const fetchData = useCallback(async () => {
    if (!userData) return;
    setDataLoading(true);
    try {
      const eventData = await fetchEventDoc(db, eventId);
      if (!eventData) {
        router.replace("/events");
        return;
      }
      setEvent(eventData);

      const my = await fetchMyRegistration(db, eventId, userData.uid);
      setMyReg(my);

      const regs = await fetchAllRegistrations(db, eventId);
      const counts = buildSlotCounts(regs);

      if (userData.role === "coordinator") {
        const withNames = await enrichRegistrationsForCoordinator(db, regs);
        setAllRegs(withNames);
      } else if (regs.some((r) => r.userId === userData.uid)) {
        const enriched = await buildPublicRegistrationList(db, regs);
        setPublicRegs(enriched);
      } else {
        setPublicRegs([]);
      }

      setSlotCounts(counts);

      const quests = await fetchAllQuestDefinitions(db);
      setEventQuests(quests);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  }, [userData, eventId, router]);

  useEffect(() => {
    if (authReady && userData) fetchData();
  }, [authReady, userData, fetchData]);

  async function handleJoin(role: EventRole) {
    if (!firebaseUser || !event) return;
    setJoiningLoading(true);
    try {
      await createEventRegistration(db, eventId, firebaseUser as FirebaseUser, role);
      setShowRoleModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningLoading(false);
    }
  }

  async function confirmAttendance(reg: EventRegistration, options?: { skipRefresh?: boolean }) {
    if (!firebaseUser) return;
    setConfirmingId(reg.userId);
    try {
      await confirmVolunteerAttendance(db, {
        eventId,
        coordinatorUid: firebaseUser.uid,
        reg,
        event,
        eventQuests,
      });
      if (!options?.skipRefresh) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmingId(null);
    }
  }

  const confirmAttendanceRef = useRef(confirmAttendance);
  confirmAttendanceRef.current = confirmAttendance;

  async function confirmAll() {
    const unconfirmed = allRegs.filter((r) => !r.attended);
    if (unconfirmed.length === 0) return;
    setConfirmingAll(true);
    for (const reg of unconfirmed) {
      await confirmAttendance(reg);
    }
    setConfirmingAll(false);
  }

  const handleQrScan = useCallback(
    async (data: string) => {
      setShowQrScanner(false);
      setCoordTab("volunteers");
      try {
        if (!isDevQuestQr(data)) {
          setScanFeedback({ ok: false, msg: "Not a DevQuest QR code." });
          setTimeout(() => setScanFeedback(null), 4000);
          return;
        }
        if (!data.startsWith("devquest://attendance?")) {
          setScanFeedback({ ok: false, msg: "Invalid DevQuest QR code type." });
          setTimeout(() => setScanFeedback(null), 4000);
          return;
        }

        const parsed = parseAttendanceQrData(data);
        if (!parsed) {
          setScanFeedback({ ok: false, msg: "QR code is missing required data." });
          setTimeout(() => setScanFeedback(null), 4000);
          return;
        }

        const { eventId: scannedEventId, userId: scannedUserId } = parsed;

        if (scannedEventId !== eventId) {
          setScanFeedback({ ok: false, msg: "QR code is for a different event." });
          setTimeout(() => setScanFeedback(null), 4000);
          return;
        }

        const regSnap = await getDoc(doc(db, "events", eventId, "registrations", scannedUserId));
        if (!regSnap.exists()) {
          setScanFeedback({ ok: false, msg: "No registration found for this volunteer." });
          setTimeout(() => setScanFeedback(null), 4000);
          return;
        }

        const reg = regSnap.data() as EventRegistration;

        if (reg.attended) {
          setScanFeedback({ ok: false, msg: "Already marked as attended." });
          setTimeout(() => setScanFeedback(null), 4000);
          return;
        }

        await confirmAttendanceRef.current(reg, { skipRefresh: true });
        setAllRegs((prev) =>
          prev.map((r) => (r.userId === reg.userId ? { ...r, attended: true } : r))
        );
        setScanFeedback({ ok: true, msg: "Attendance confirmed! ✓" });
      } catch (err) {
        console.error(err);
        setScanFeedback({ ok: false, msg: "Failed to read QR code." });
      }
      setTimeout(() => setScanFeedback(null), 4000);
    },
    [eventId]
  );

  async function handleSaveEdit(fields: EditEventFields, bannerFile: File | null) {
    setSaving(true);
    try {
      await updateEventFromEditFields(db, storage, eventId, fields, bannerFile);
      await fetchData();
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEventAndBanner(db, storage, eventId, event?.bannerUrl);
      router.replace("/events");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  function exportCsv() {
    if (!event) return;
    exportVolunteersCsv(event.name, allRegs);
  }

  return {
    authReady: authReady && !!userData,
    userData,
    firebaseUser,
    event,
    myReg,
    allRegs,
    setAllRegs,
    publicRegs,
    slotCounts,
    dataLoading,
    showRoleModal,
    setShowRoleModal,
    joiningLoading,
    showQrScanner,
    setShowQrScanner,
    coordTab,
    setCoordTab,
    roleFilter,
    setRoleFilter,
    confirmingId,
    confirmingAll,
    scanFeedback,
    showEditModal,
    setShowEditModal,
    saving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleting,
    handleJoin,
    confirmAttendance,
    confirmAll,
    handleQrScan,
    handleSaveEdit,
    handleDelete,
    exportCsv,
    eventId,
  };
}
