import { Timestamp } from "firebase/firestore";
import type { AvatarOptions } from "@/lib/avatar";

export interface EventRole {
  roleName: string;
  slots: number;
  xpReward: number;
}

export interface EventDoc {
  eventId: string;
  name: string;
  description: string;
  date: Timestamp;
  endDate?: Timestamp;
  location: string;
  chapterId: string;
  eventType?: string;
  isInternal?: boolean;
  roles: EventRole[];
  lumaUrl?: string;
  bannerUrl?: string;
}

/** Registration subdocument under events/{eventId}/registrations/{uid} */
export interface EventRegistration {
  userId: string;
  role: string;
  roleXP: number;
  qrData: string;
  attended: boolean;
  reflectionSubmitted: boolean;
  reflectionDeadline?: Timestamp;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
  username?: string;
  avatarOptions?: AvatarOptions;
}

export interface PublicRegistrationRow {
  userId: string;
  username: string;
  role: string;
  avatarOptions?: AvatarOptions;
}

export interface EditEventFields {
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  lumaUrl: string;
}
