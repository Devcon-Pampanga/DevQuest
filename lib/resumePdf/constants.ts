export const MARGIN_MM = 18;
export const PAGE_W = 210;
export const PAGE_H = 297;
export const ACCENT_BAR_W = 3;
export const ACCENT_BAR_GAP = 4;
export const HEADER_H = 38;
/** Purple profile block width (mm); remainder of content width is XP / links. */
export const HEADER_LEFT_ZONE_MM = 114;
/** Horizontal padding inside the purple block for text (mm). */
export const HEADER_INNER_PAD_MM = 4;

export const PURPLE: [number, number, number] = [124, 58, 237];
export const PURPLE_LIGHT: [number, number, number] = [168, 85, 247];
export const PURPLE_TINT: [number, number, number] = [245, 244, 255];
export const PURPLE_PILL: [number, number, number] = [237, 233, 254];
export const LAVENDER: [number, number, number] = [220, 200, 255];
export const GRAY_900: [number, number, number] = [15, 15, 20];
export const GRAY_600: [number, number, number] = [82, 82, 91];
export const GRAY_300: [number, number, number] = [212, 212, 216];
export const GREEN: [number, number, number] = [34, 197, 94];
export const WHITE: [number, number, number] = [255, 255, 255];

export const TEAM_COLORS: Record<string, [number, number, number]> = {
  "Lead Learners": [245, 197, 24],
  "People & Culture": [249, 115, 22],
  "Community Engagement": [6, 182, 212],
  Creatives: [147, 51, 234],
  Sustainability: [34, 197, 94],
};

export function getTeamColor(label: string): [number, number, number] {
  return TEAM_COLORS[label] ?? PURPLE_LIGHT;
}

export function sanitizeFileBaseName(raw: string): string {
  const s = raw.trim().replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "resume";
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "\u2026";
}
