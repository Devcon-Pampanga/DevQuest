/** Constants and pure helpers for the Add Event page (`events/new`). */

export interface RoleEntry {
  id: string;
  roleName: string;
  xpReward: number;
  slots: number;
}

export const DEFAULT_ROLES: RoleEntry[] = [
  { id: "facilitator", roleName: "Facilitator", xpReward: 60, slots: 10 },
  { id: "host", roleName: "Host", xpReward: 50, slots: 5 },
  { id: "tech", roleName: "Tech", xpReward: 40, slots: 5 },
  { id: "registration", roleName: "Registration", xpReward: 30, slots: 10 },
  { id: "usher", roleName: "Usher", xpReward: 30, slots: 10 },
  { id: "documentation", roleName: "Documentation", xpReward: 30, slots: 5 },
];

// Event types that default to attendee-only (no volunteer role selection)
export const INTERNAL_EVENT_TYPES = new Set(["Lead Learner Workshop", "Volunteer Orientation"]);

// XP tiers for internal / attendee-only events
export const ATTENDEE_XP_TIERS = [
  { label: "Brief Session", description: "1–2 hour drop-in or orientation", xp: 20 },
  { label: "Full Session", description: "Half-day to full-day workshop", xp: 35 },
  { label: "Intensive", description: "Multi-day or demanding program", xp: 60 },
] as const;

export const EVENT_TYPES = [
  "Code Camp",
  "Lead Learner Workshop",
  "Volunteer Orientation",
  "School Event",
  "External Workshop",
  "Tech Summit",
  "Volunteer Social Meetup",
  "Workshop",
  "Seminar",
  "Convention",
  "Hackathon",
  "Networking",
  "Training",
  "Community Meetup",
  "Other",
];

export type EventScale = "small" | "medium" | "large" | "conference";

export const EVENT_SCALES: { value: EventScale; label: string }[] = [
  { value: "small", label: "Small (< 20 Attendees)" },
  { value: "medium", label: "Medium (20–50 Attendees)" },
  { value: "large", label: "Large (50–150 Attendees)" },
  { value: "conference", label: "Conference (150+ Attendees)" },
];

const WORKSHOP_TYPES = new Set([
  "Workshop",
  "Seminar",
  "Training",
  "Lead Learner Workshop",
  "External Workshop",
  "Code Camp",
]);
const CONVENTION_TYPES = new Set(["Convention", "Hackathon", "Tech Summit", "School Event"]);
const SOCIAL_TYPES = new Set([
  "Volunteer Social Meetup",
  "Networking",
  "Volunteer Orientation",
  "Community Meetup",
]);

// slots: 0 means role is excluded for this combination
export const SCALE_LOADOUTS: Record<string, Record<EventScale, Record<string, number>>> = {
  workshop: {
    small: { Facilitator: 3, Host: 0, Tech: 2, Registration: 2, Usher: 0, Documentation: 1 },
    medium: { Facilitator: 6, Host: 1, Tech: 3, Registration: 4, Usher: 0, Documentation: 2 },
    large: { Facilitator: 12, Host: 2, Tech: 6, Registration: 8, Usher: 5, Documentation: 3 },
    conference: { Facilitator: 20, Host: 3, Tech: 10, Registration: 12, Usher: 10, Documentation: 5 },
  },
  convention: {
    small: { Facilitator: 4, Host: 1, Tech: 3, Registration: 4, Usher: 0, Documentation: 2 },
    medium: { Facilitator: 8, Host: 2, Tech: 6, Registration: 8, Usher: 5, Documentation: 3 },
    large: { Facilitator: 15, Host: 3, Tech: 10, Registration: 15, Usher: 10, Documentation: 5 },
    conference: { Facilitator: 25, Host: 5, Tech: 20, Registration: 25, Usher: 20, Documentation: 8 },
  },
  social: {
    small: { Facilitator: 0, Host: 0, Tech: 0, Registration: 3, Usher: 3, Documentation: 1 },
    medium: { Facilitator: 0, Host: 1, Tech: 0, Registration: 5, Usher: 5, Documentation: 2 },
    large: { Facilitator: 0, Host: 2, Tech: 2, Registration: 10, Usher: 8, Documentation: 3 },
    conference: { Facilitator: 3, Host: 3, Tech: 4, Registration: 15, Usher: 12, Documentation: 5 },
  },
  other: {
    small: { Facilitator: 3, Host: 0, Tech: 0, Registration: 3, Usher: 0, Documentation: 1 },
    medium: { Facilitator: 5, Host: 1, Tech: 2, Registration: 5, Usher: 0, Documentation: 2 },
    large: { Facilitator: 10, Host: 2, Tech: 4, Registration: 10, Usher: 5, Documentation: 3 },
    conference: { Facilitator: 15, Host: 3, Tech: 8, Registration: 15, Usher: 10, Documentation: 5 },
  },
};

export function getEventCategory(type: string): "workshop" | "convention" | "social" | "other" {
  if (WORKSHOP_TYPES.has(type)) return "workshop";
  if (CONVENTION_TYPES.has(type)) return "convention";
  if (SOCIAL_TYPES.has(type)) return "social";
  return "other";
}

export function buildRolesFromPreset(type: string, scale: EventScale): RoleEntry[] {
  const cat = getEventCategory(type);
  const loadout = SCALE_LOADOUTS[cat][scale];
  return DEFAULT_ROLES.filter((r) => (loadout[r.roleName] ?? 0) > 0).map((r) => ({
    ...r,
    slots: loadout[r.roleName],
  }));
}

export const NEW_EVENT_WAVE_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];
