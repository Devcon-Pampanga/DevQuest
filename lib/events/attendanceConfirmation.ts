import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EventDoc, EventRegistration } from "./types";
import type { Quest } from "@/types/quest";
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

  await updateDoc(doc(firestore, "events", eventId, "registrations", reg.userId), {
    attended: true,
    confirmedAt: serverTimestamp(),
    confirmedBy: coordinatorUid,
    reflectionDeadline: deadline,
  });

  await updateDoc(doc(firestore, "users", reg.userId), {
    xp: increment(reg.roleXP),
  });
  await addDoc(collection(firestore, "users", reg.userId, "xpLog"), {
    source: "event_attendance",
    sourceId: eventId,
    description: `Attended ${event?.name ?? "event"} as ${reg.role}`,
    xp: reg.roleXP,
    createdAt: serverTimestamp(),
  });

  await addDoc(collection(firestore, "users", reg.userId, "notifications"), {
    type: "attendance_confirmed",
    message: `Your attendance at ${event?.name ?? "the event"} has been confirmed. +${reg.roleXP} XP!`,
    read: false,
    relatedId: eventId,
    createdAt: serverTimestamp(),
  });

  try {
    await completeQrScanQuestsForAttendance(
      firestore,
      reg.userId,
      reg.role,
      event,
      eventQuests
    );
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
