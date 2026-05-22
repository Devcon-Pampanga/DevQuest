import {
  doc,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Quest } from "@/types/quest";
import type { AvatarOptions } from "@/lib/avatar";
import type { EventDoc, EventRegistration, PublicRegistrationRow } from "./types";

export function buildSlotCounts(regs: EventRegistration[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const reg of regs) {
    counts[reg.role] = (counts[reg.role] ?? 0) + 1;
  }
  return counts;
}

export async function fetchEventDoc(
  db: Firestore,
  eventId: string
): Promise<EventDoc | null> {
  const snap = await getDoc(doc(db, "events", eventId));
  if (!snap.exists()) return null;
  return { eventId: snap.id, ...snap.data() } as EventDoc;
}

export async function fetchMyRegistration(
  db: Firestore,
  eventId: string,
  uid: string
): Promise<EventRegistration | null> {
  const snap = await getDoc(doc(db, "events", eventId, "registrations", uid));
  if (!snap.exists()) return null;
  return snap.data() as EventRegistration;
}

export async function fetchAllRegistrations(
  db: Firestore,
  eventId: string
): Promise<EventRegistration[]> {
  const snap = await getDocs(collection(db, "events", eventId, "registrations"));
  return snap.docs.map((d) => d.data() as EventRegistration);
}

export async function enrichRegistrationsForCoordinator(
  db: Firestore,
  regs: EventRegistration[]
): Promise<EventRegistration[]> {
  return Promise.all(
    regs.map(async (reg) => {
      try {
        const uSnap = await getDoc(doc(db, "users", reg.userId));
        return {
          ...reg,
          username: uSnap.data()?.username ?? reg.userId,
          avatarOptions: uSnap.data()?.avatarOptions as AvatarOptions | undefined,
        };
      } catch {
        return { ...reg, username: reg.userId };
      }
    })
  );
}

export async function buildPublicRegistrationList(
  db: Firestore,
  regs: EventRegistration[]
): Promise<PublicRegistrationRow[]> {
  return Promise.all(
    regs.map(async (reg) => {
      try {
        const uSnap = await getDoc(doc(db, "users", reg.userId));
        return {
          userId: reg.userId,
          username: uSnap.data()?.username ?? reg.userId,
          role: reg.role,
          avatarOptions: uSnap.data()?.avatarOptions as AvatarOptions | undefined,
        };
      } catch {
        return { userId: reg.userId, username: reg.userId, role: reg.role };
      }
    })
  );
}

export async function fetchAllQuestDefinitions(db: Firestore): Promise<Quest[]> {
  const questsSnap = await getDocs(collection(db, "quests"));
  return questsSnap.docs.map((d) => d.data() as Quest);
}
