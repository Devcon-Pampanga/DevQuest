import type { Timestamp } from "firebase/firestore";
import type { AvatarOptions } from "@/lib/avatar";

/**
 * Firestore `users/{uid}` document merged with `uid` for client session state.
 */
export interface SessionUser {
  uid: string;
  email: string;
  role: "volunteer" | "coordinator";
  username: string;
  usernameLower: string;
  contactNumber: string;
  chapterId: string;
  teams: string[];
  xp: number;
  onboardingComplete: boolean;
  linkedinUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
  createdAt?: Timestamp;
  avatarOptions?: AvatarOptions;
}
