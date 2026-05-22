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

export type ReflectionRatingKey = "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8";
export type ReflectionMood = "drained" | "okay" | "good" | "energized";

export interface ReflectionData {
  firstName: string;
  lastName: string;
  rolePosition: string;
  chapterId: string;
  ratings: Record<ReflectionRatingKey, number>;
  mood: ReflectionMood;
  insights: string;
  submittedAt: Timestamp;
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
  reflectionData?: ReflectionData;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
  username?: string;
  avatarOptions?: AvatarOptions;
  starsGiven?: string[];
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
