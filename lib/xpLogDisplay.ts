export function xpLogSourceIconColor(source: string): string {
  if (source === "event_attendance") return "#3B82F6";
  if (source === "quest_completion") return "#A855F7";
  if (source === "reflection") return "#FACC15";
  if (source === "profile_setup") return "#22C55E";
  if (source === "tier_bonus") return "#EAB308";
  return "#71717A";
}
