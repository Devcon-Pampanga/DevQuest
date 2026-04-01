import { Timestamp } from "firebase/firestore";

export type QuestTier = "team_member" | "associate" | "specialist" | "lead";
export type CompletionMethod = "qr_scan" | "coordinator_approval" | "self_mark";
export type QuestStatus = "in_progress" | "pending_approval" | "completed";
// UI-only status — extends QuestStatus with display-only states
export type UIQuestStatus = "locked" | "available" | "in_progress" | "pending_approval" | "completed";

export interface Quest {
  questId: string;
  teamId: string;
  tier: QuestTier;
  name: string;
  description: string;
  xpReward: number;
  completionMethod: CompletionMethod;
  approvalType?: "standard" | "major";
  triggerEventType?: string; // event type required to auto-complete via QR scan
  triggerRole?: string;      // role keyword (case-insensitive substring match); undefined = any role qualifies
}

export interface QuestCompletion {
  questId: string;
  status: QuestStatus;
  submissionNotes?: string;
  evidenceUrl?: string;
  approvedBy?: string;
  completedAt?: Timestamp;
  xpGranted: number;
  revisionNote?: string;
}

export interface ApprovalsQueueItem {
  userId: string;
  username: string;
  avatarOptions?: {
    backgroundColor: string;
    backgroundType: "solid" | "gradientLinear";
    eyes: string;
    mouth: string;
  };
  teamId: string;
  questId: string;
  questName: string;
  submissionNotes?: string;
  evidenceUrl?: string;
  xpReward: number;
  submittedAt?: Timestamp;
}
