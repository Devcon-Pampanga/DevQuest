import { Timestamp } from "firebase/firestore";

export type XPLogSource =
  | "event_attendance"
  | "quest_completion"
  | "reflection"
  | "profile_setup"
  | "tier_bonus";

export interface XPLogEntry {
  logId?: string;
  source: XPLogSource | string;
  description: string;
  xp: number;
  createdAt?: Timestamp;
}
