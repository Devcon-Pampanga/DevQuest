import {
  doc,
  collection,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EventDoc, EventRegistration } from "./types";
import type { Quest } from "@/types/quest";
import { addXpRewardToBatch } from "@/lib/devCoins";
import { completeQrScanQuestsForAttendance } from "./completeQrScanQuests";

export interface ConfirmAttendanceParams {
  eventId: string;
  coordinatorUid: string;
  reg: EventRegistration;
  event: EventDoc | null;
  eventQuests: Quest[];
}

/**
 * Marks attendance, grants XP, notifies volunteer, runs qr_scan quest auto-completion.
 */
export async function confirmVolunteerAttendance(
  firestore: Firestore,
  params: ConfirmAttendanceParams
): Promise<void> {
  const { eventId, coordinatorUid, reg, event, eventQuests } = params;
  const deadline = Timestamp.fromDate(new Date(Date.now() + 72 * 60 * 60 * 1000));
  const batch = writeBatch(firestore);

  console.log("[Attendance] Confirm start", {
    eventId,
    coordinatorUid,
    userId: reg.userId,
    role: reg.role,
    roleXP: reg.roleXP,
    eventName: event?.name ?? null,
  });

  batch.update(doc(firestore, "events", eventId, "registrations", reg.userId), {
    attended: true,
    confirmedAt: serverTimestamp(),
    confirmedBy: coordinatorUid,
    reflectionDeadline: deadline,
  });

  addXpRewardToBatch({
    firestore,
    uid: reg.userId,
    xp: reg.roleXP,
    source: "event_attendance",
    sourceId: eventId,
    description: `Attended ${event?.name ?? "event"} as ${reg.role}`,
    batch,
  });
  console.log("[Attendance] Reward queued", {
    userId: reg.userId,
    xp: reg.roleXP,
    source: "event_attendance",
    sourceId: eventId,
  });
  const notificationRef = doc(collection(firestore, "users", reg.userId, "notifications"));
  batch.set(notificationRef, {
    type: "attendance_confirmed",
    message: `Your attendance at ${event?.name ?? "the event"} has been confirmed. +${reg.roleXP} XP!`,
    read: false,
    relatedId: eventId,
    createdAt: serverTimestamp(),
  });
  console.log("[Attendance] Committing attendance batch", {
    eventId,
    userId: reg.userId,
  });
  try {
    await batch.commit();
    console.log("[Attendance] Attendance batch committed", {
      eventId,
      userId: reg.userId,
    });
  } catch (error) {
    console.error("[Attendance] Attendance batch commit failed", {
      eventId,
      userId: reg.userId,
      error,
    });
    throw error;
  }

  try {
    await completeQrScanQuestsForAttendance(
      firestore,
      reg.userId,
      reg.role,
      event,
      eventQuests
    );
    console.log("[Attendance] QR scan quest completion finished", {
      eventId,
      userId: reg.userId,
    });
  } catch (questErr) {
    console.error("Quest auto-completion failed:", questErr);
  }
}

/** Default export uses shared `db` instance for convenience in client hooks. */
export async function confirmVolunteerAttendanceDefault(
  params: ConfirmAttendanceParams
): Promise<void> {
  return confirmVolunteerAttendance(db, params);
}
