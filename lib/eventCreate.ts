import { collection, doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { RoleEntry } from "@/lib/eventNewConstants";

type EventRouter = { push: (href: string) => void };

export async function submitNewEvent(params: {
  router: EventRouter;
  chapterId: string;
  uid: string;
  eventName: string;
  eventType: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  lumaLink: string;
  bannerFile: File | null;
  isInternal: boolean;
  attendeeSlots: number;
  attendeeXP: number;
  roles: RoleEntry[];
  setSuccessInfo: (v: { eventId: string; eventName: string } | null) => void;
  setSubmitError: (msg: string) => void;
  setSubmitting: (v: boolean) => void;
}): Promise<void> {
  const {
    router,
    chapterId,
    uid,
    eventName,
    eventType,
    description,
    eventDate,
    startTime,
    endTime,
    location,
    lumaLink,
    bannerFile,
    isInternal,
    attendeeSlots,
    attendeeXP,
    roles,
    setSuccessInfo,
    setSubmitError,
    setSubmitting,
  } = params;

  setSubmitting(true);

  try {
    const startTs = Timestamp.fromDate(new Date(`${eventDate}T${startTime || "00:00"}`));
    const endTs = endTime ? Timestamp.fromDate(new Date(`${eventDate}T${endTime}`)) : null;

    const eventRef = doc(collection(db, "events"));

    let bannerUrl: string | undefined;
    if (bannerFile) {
      const bannerRef = ref(storage, `event-banners/${eventRef.id}/banner`);
      await uploadBytes(bannerRef, bannerFile);
      bannerUrl = await getDownloadURL(bannerRef);
    }

    await setDoc(eventRef, {
      eventId: eventRef.id,
      name: eventName.trim(),
      eventType,
      description: description.trim(),
      date: startTs,
      ...(endTs ? { endDate: endTs } : {}),
      location: location.trim(),
      ...(lumaLink ? { lumaUrl: lumaLink } : {}),
      ...(bannerUrl ? { bannerUrl } : {}),
      chapterId,
      createdBy: uid,
      ...(isInternal ? { isInternal: true } : {}),
      roles: isInternal
        ? [{ roleName: "Attendee", xpReward: Number(attendeeXP) || 30, slots: Number(attendeeSlots) || 1 }]
        : roles.map(({ roleName, xpReward, slots }) => ({
            roleName,
            xpReward,
            slots: Number(slots) || 1,
          })),
      createdAt: serverTimestamp(),
    });

    setSuccessInfo({ eventId: eventRef.id, eventName: eventName.trim() });
    setTimeout(() => router.push(`/events/${eventRef.id}`), 2400);
  } catch (err) {
    console.error(err);
    setSubmitError("Failed to create the event. Please try again.");
    setSubmitting(false);
  }
}
