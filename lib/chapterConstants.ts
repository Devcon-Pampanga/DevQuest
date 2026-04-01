import type { Timestamp } from "firebase/firestore";

export const CHAPTERS = [
  "DEVCON Kids Baguio",
  "DEVCON Kids Cagayan de Oro",
  "DEVCON Kids Cebu",
  "DEVCON Kids Davao",
  "DEVCON Kids Iloilo",
  "DEVCON Kids Manila",
  "DEVCON Kids Pampanga",
  "DEVCON Kids Quezon City",
  "DEVCON Kids Tacloban",
  "DEVCON Kids Zamboanga",
] as const;

export const CHAPTER_REGIONS: Record<string, string> = {
  "DEVCON Kids Baguio": "CAR · Cordillera",
  "DEVCON Kids Cagayan de Oro": "Region X · Northern Mindanao",
  "DEVCON Kids Cebu": "Region VII · Central Visayas",
  "DEVCON Kids Davao": "Region XI · Davao Region",
  "DEVCON Kids Iloilo": "Region VI · Western Visayas",
  "DEVCON Kids Manila": "NCR · Metro Manila",
  "DEVCON Kids Pampanga": "Region III · Central Luzon",
  "DEVCON Kids Quezon City": "NCR · Metro Manila",
  "DEVCON Kids Tacloban": "Region VIII · Eastern Visayas",
  "DEVCON Kids Zamboanga": "Region IX · Zamboanga Peninsula",
};

export const MEDAL_COLORS = ["#F5C518", "#A1A1AA", "#CD7F32"] as const;
export const MEDAL_LABELS = ["Master of Season", "Silver Medal", "Bronze Medal"] as const;

export function formatEventDate(ts: Timestamp): string {
  const d = ts.toDate();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function totalSlots(roles: { roleName: string; slots: number; xpReward: number }[]): number {
  return roles.reduce((sum, r) => sum + r.slots, 0);
}

export function shortChapter(name: string): string {
  return name.replace(/^DEVCON Kids\s+/i, "");
}
