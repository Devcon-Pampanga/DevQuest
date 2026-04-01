import type { AvatarOptions } from "@/lib/avatar";

export interface PendingReflection {
  eventId: string;
  eventName: string;
  hoursLeft: number;
}

export interface DashboardLeaderboardEntry {
  uid: string;
  username: string;
  xp: number;
  avatarOptions?: AvatarOptions;
}
