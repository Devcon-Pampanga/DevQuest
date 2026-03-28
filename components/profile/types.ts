import { Timestamp } from "firebase/firestore";
import type { AvatarOptions } from "@/lib/avatar";

export interface ProfilePageUser {
  uid: string;
  username: string;
  email?: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  teams: string[];
  xp: number;
  contactNumber: string;
  linkedinUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
  createdAt?: Timestamp;
  avatarOptions?: AvatarOptions;
  onboardingComplete?: boolean;
}
