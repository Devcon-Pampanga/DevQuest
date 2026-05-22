import { Timestamp } from "firebase/firestore";
import type { AvatarOptions } from "@/lib/avatar";

export const SUBQUESTS_COLLECTION = "subquests";
export const SUBQUEST_COMPLETIONS_COLLECTION = "subquestCompletions";

/** Row in the "specific volunteers" picker on Add Subquest (subset of Firestore `users`). */
export interface SubquestVolunteerPickerRow {
  uid: string;
  username: string;
  teams: string[];
  avatarOptions?: AvatarOptions;
}

export type SubquestDifficulty = "easy" | "medium" | "hard";
export type SubquestAssignmentType = "specific" | "team" | "open";
export type SubquestStatus = "active" | "closed";
export type SubquestCompletionStatus =
  | "assigned"
  | "joined"
  | "submitted"
  | "completed";

export interface Subquest {
  subquestId: string;
  title: string;
  description: string;
  difficulty: SubquestDifficulty;
  xpReward: number; // 25 / 75 / 150
  assignmentType: SubquestAssignmentType;
  assignedTo?: string[]; // UIDs — specific assignments only
  assignedTeams?: string[]; // teamIds — team assignments only
  slots?: number; // open enrollment only
  deadline?: Timestamp; // optional
  submissionGuidance?: string; // optional hint for volunteers
  chapterId: string;
  createdBy: string; // coordinator UID
  createdByUsername: string;
  status: SubquestStatus;
  createdAt: Timestamp;
}

export interface SubquestCompletion {
  subquestId: string;
  status: SubquestCompletionStatus;
  submissionNotes?: string;
  evidenceUrl?: string;
  approvedBy?: string;
  completedAt?: Timestamp;
  xpGranted: number;
  revisionNote?: string;
}

export interface SubquestApprovalItem {
  userId: string;
  username: string;
  avatarOptions?: {
    backgroundColor: string;
    backgroundType: "solid" | "gradientLinear";
    eyes: string;
    mouth: string;
  };
  subquestId: string;
  subquestTitle: string;
  difficulty: SubquestDifficulty;
  xpReward: number;
  submissionNotes?: string;
  evidenceUrl?: string;
  submittedAt?: Timestamp;
}

export function getSubquestIdFromData(
  data: Record<string, unknown>,
  fallbackId: string
): string {
  const subquestId = data.subquestId;
  if (typeof subquestId === "string" && subquestId.trim()) {
    return subquestId;
  }

  const missionId = data.missionId;
  if (typeof missionId === "string" && missionId.trim()) {
    return missionId;
  }

  return fallbackId;
}

export function getSubquestTitleFromData(data: Record<string, unknown>): string {
  const subquestTitle = data.subquestTitle;
  if (typeof subquestTitle === "string" && subquestTitle.trim()) {
    return subquestTitle;
  }

  const missionTitle = data.missionTitle;
  if (typeof missionTitle === "string" && missionTitle.trim()) {
    return missionTitle;
  }

  return "";
}

export const DIFFICULTY_META: Record<
  SubquestDifficulty,
  { label: string; color: string; xp: number }
> = {
  easy: { label: "Easy", color: "#22C55E", xp: 25 },
  medium: { label: "Medium", color: "#F5C518", xp: 75 },
  hard: { label: "Hard", color: "#EF4444", xp: 150 },
};
