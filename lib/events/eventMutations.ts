import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";
import type { User as FirebaseUser } from "firebase/auth";
import type { EventRole, EditEventFields, EventRegistration } from "./types";

export async function createEventRegistration(
  firestore: Firestore,
  eventId: string,
  firebaseUser: FirebaseUser,
  role: EventRole
): Promise<void> {
  const qrData = `devquest://attendance?eventId=${eventId}&userId=${firebaseUser.uid}&role=${encodeURIComponent(role.roleName)}`;
  await setDoc(doc(firestore, "events", eventId, "registrations", firebaseUser.uid), {
    userId: firebaseUser.uid,
    role: role.roleName,
    roleXP: role.xpReward,
    qrData,
    attended: false,
    reflectionSubmitted: false,
    registeredAt: Timestamp.now(),
  });
}

export async function switchEventRegistrationRole(
  firestore: Firestore,
  eventId: string,
  targetUserId: string,
  newRole: EventRole
): Promise<void> {
  const qrData = `devquest://attendance?eventId=${eventId}&userId=${targetUserId}&role=${encodeURIComponent(newRole.roleName)}`;
  await updateDoc(doc(firestore, "events", eventId, "registrations", targetUserId), {
    role: newRole.roleName,
    roleXP: newRole.xpReward,
    qrData,
  });
}

export async function leaveEvent(
  firestore: Firestore,
  eventId: string,
  userId: string
): Promise<void> {
  await deleteDoc(doc(firestore, "events", eventId, "registrations", userId));
}

export async function updateEventFromEditFields(
  firestore: Firestore,
  storage: FirebaseStorage,
  eventId: string,
  fields: EditEventFields,
  bannerFile: File | null
): Promise<void> {
  const startTs = Timestamp.fromDate(new Date(`${fields.date}T${fields.startTime || "00:00"}`));
  const endTs = fields.endTime
    ? Timestamp.fromDate(new Date(`${fields.date}T${fields.endTime}`))
    : null;

  const updates: Record<string, unknown> = {
    name: fields.name.trim(),
    description: fields.description.trim(),
    date: startTs,
    location: fields.location.trim(),
  };
  if (endTs) updates.endDate = endTs;
  if (fields.lumaUrl.trim()) updates.lumaUrl = fields.lumaUrl.trim();
  if (fields.roles && fields.roles.length > 0) updates.roles = fields.roles;

  if (bannerFile) {
    const bannerRef = ref(storage, `event-banners/${eventId}/banner`);
    try {
      await deleteObject(bannerRef);
    } catch {
      /* no existing banner */
    }
    await uploadBytes(bannerRef, bannerFile);
    updates.bannerUrl = await getDownloadURL(bannerRef);
  }

  await updateDoc(doc(firestore, "events", eventId), updates);
}

export async function revokeVolunteersForRoleChanges(
  firestore: Firestore,
  eventId: string,
  oldRoles: EventRole[],
  newRoles: EventRole[],
  allRegs: EventRegistration[]
): Promise<void> {
  const newSlotsMap = new Map(newRoles.map((r) => [r.roleName, r.slots]));
  const toDelete = new Set<string>();

  for (const oldRole of oldRoles) {
    const unattended = allRegs.filter(
      (r) => r.role === oldRole.roleName && !r.attended
    );
    if (!newSlotsMap.has(oldRole.roleName)) {
      unattended.forEach((r) => toDelete.add(r.userId));
    } else {
      const excess = Math.max(0, unattended.length - newSlotsMap.get(oldRole.roleName)!);
      if (excess > 0) {
        const sorted = [...unattended].sort(
          (a, b) => (a.registeredAt?.toMillis() ?? 0) - (b.registeredAt?.toMillis() ?? 0)
        );
        sorted.slice(sorted.length - excess).forEach((r) => toDelete.add(r.userId));
      }
    }
  }

  await Promise.all(
    Array.from(toDelete).map((uid) =>
      deleteDoc(doc(firestore, "events", eventId, "registrations", uid))
    )
  );
}

export async function deleteEventAndBanner(
  firestore: Firestore,
  storage: FirebaseStorage,
  eventId: string,
  bannerUrl?: string
): Promise<void> {
  if (bannerUrl) {
    try {
      await deleteObject(ref(storage, `event-banners/${eventId}/banner`));
    } catch {
      /* banner may not exist */
    }
  }
  await deleteDoc(doc(firestore, "events", eventId));
}
