import { Timestamp } from "firebase/firestore";

export type MissionDifficulty = "easy" | "medium" | "hard";
export type MissionAssignmentType = "specific" | "team" | "open";
export type MissionStatus = "active" | "closed";
export type MissionCompletionStatus =
  | "assigned"
  | "joined"
  | "submitted"
  | "completed";

export interface Mission {
  missionId: string;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  xpReward: number; // 25 / 75 / 150
  assignmentType: MissionAssignmentType;
  assignedTo?: string[]; // UIDs — specific assignments only
  assignedTeams?: string[]; // teamIds — team assignments only
  slots?: number; // open enrollment only
  deadline?: Timestamp; // optional
  submissionGuidance?: string; // optional hint for volunteers
  chapterId: string;
  createdBy: string; // coordinator UID
  createdByUsername: string;
  status: MissionStatus;
  createdAt: Timestamp;
}

export interface MissionCompletion {
  missionId: string;
  status: MissionCompletionStatus;
  submissionNotes?: string;
  evidenceUrl?: string;
  approvedBy?: string;
  completedAt?: Timestamp;
  xpGranted: number;
  revisionNote?: string;
}

export interface MissionApprovalItem {
  userId: string;
  username: string;
  avatarOptions?: {
    backgroundColor: string;
    backgroundType: "solid" | "gradientLinear";
    eyes: string;
    mouth: string;
  };
  missionId: string;
  missionTitle: string;
  difficulty: MissionDifficulty;
  xpReward: number;
  submissionNotes?: string;
  evidenceUrl?: string;
  submittedAt?: Timestamp;
}

export const DIFFICULTY_META: Record<
  MissionDifficulty,
  { label: string; color: string; xp: number }
> = {
  easy: { label: "Easy", color: "#22C55E", xp: 25 },
  medium: { label: "Medium", color: "#F5C518", xp: 75 },
  hard: { label: "Hard", color: "#EF4444", xp: 150 },
};
