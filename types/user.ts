import { FieldValue, Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  email: string;
  role: "volunteer" | "coordinator";
  username: string;
  usernameLower: string;
  contactNumber: string;
  linkedinUrl?: string;
  githubUrl?: string;
  chapterId: string;
  teams: string[];
  xp: number;
  onboardingComplete: boolean;
  createdAt: Timestamp;
}

/** Subset written to Firestore on initial sign-up.
 *  username / contactNumber / chapterId are empty strings — filled during onboarding. */
export interface InitialUserDocument {
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
  createdAt: FieldValue;
}
