import type { Timestamp } from "firebase/firestore";
import type { AvatarOptions } from "@/lib/avatar";

/** Logged-in user fields used by the chapter dashboard. */
export interface ChapterSessionUser {
  uid: string;
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  xp: number;
  teams: string[];
  avatarOptions?: AvatarOptions;
}

/** Volunteer row / leaderboard / coordinator card shape from Firestore `users`. */
export interface ChapterVolunteer {
  uid: string;
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  xp: number;
  teams: string[];
  avatarOptions?: AvatarOptions;
}

export interface ChapterEventDoc {
  eventId: string;
  name: string;
  date: Timestamp;
  location: string;
  chapterId: string;
  roles: { roleName: string; slots: number; xpReward: number }[];
  bannerUrl?: string;
  eventType?: string;
  isInternal?: boolean;
}
