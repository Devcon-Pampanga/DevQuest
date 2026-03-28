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
import type { EventRole, EditEventFields } from "./types";

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
  });
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
