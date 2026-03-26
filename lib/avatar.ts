// ─── Shared avatar types, constants, and helpers ─────────────────────────────
// Used across dashboard, settings, events, profile, quests, and notifications.

export interface AvatarOptions {
  backgroundColor: string;
  backgroundType: "solid" | "gradientLinear";
  eyes: string;
  mouth: string;
}

export const DEFAULT_AVATAR: AvatarOptions = {
  backgroundColor: "5e35b1",
  backgroundType: "solid",
  eyes: "round",
  mouth: "smile01",
};

// ─── Avatar editor constants (used in avatar customization dialogs) ───────────

export const BG_COLORS: { hex: string; label: string }[] = [
  { hex: "transparent", label: "None" },
  { hex: "ffb300", label: "Amber" },
  { hex: "fdd835", label: "Yellow" },
  { hex: "43a047", label: "Green" },
  { hex: "00acc1", label: "Teal" },
  { hex: "039be5", label: "Blue" },
  { hex: "1e88e5", label: "Indigo" },
  { hex: "5e35b1", label: "Purple" },
  { hex: "8e24aa", label: "Violet" },
  { hex: "d81b60", label: "Pink" },
  { hex: "e53935", label: "Red" },
  { hex: "f4511e", label: "Orange" },
  { hex: "00897b", label: "Mint" },
];

export const EYES_OPTIONS: { id: string; label: string }[] = [
  { id: "bulging", label: "Bulging" },
  { id: "dizzy", label: "Dizzy" },
  { id: "eva", label: "Eva" },
  { id: "frame1", label: "Frame 1" },
  { id: "frame2", label: "Frame 2" },
  { id: "glow", label: "Glow" },
  { id: "happy", label: "Happy" },
  { id: "hearts", label: "Hearts" },
  { id: "robocop", label: "Robocop" },
  { id: "round", label: "Round" },
  { id: "roundFrame01", label: "Round Frame 1" },
  { id: "roundFrame02", label: "Round Frame 2" },
  { id: "sensor", label: "Sensor" },
  { id: "shade01", label: "Shade" },
];

export const MOUTH_OPTIONS: { id: string; label: string }[] = [
  { id: "bite", label: "Bite" },
  { id: "diagram", label: "Diagram" },
  { id: "grill01", label: "Grill 1" },
  { id: "grill02", label: "Grill 2" },
  { id: "grill03", label: "Grill 3" },
  { id: "smile01", label: "Smile 1" },
  { id: "smile02", label: "Smile 2" },
  { id: "square01", label: "Square 1" },
  { id: "square02", label: "Square 2" },
];

export function randomAvatar(): AvatarOptions {
  const colorPool = BG_COLORS.filter((c) => c.hex !== "transparent");
  return {
    backgroundColor: colorPool[Math.floor(Math.random() * colorPool.length)].hex,
    backgroundType: Math.random() < 0.5 ? "solid" : "gradientLinear",
    eyes: EYES_OPTIONS[Math.floor(Math.random() * EYES_OPTIONS.length)].id,
    mouth: MOUTH_OPTIONS[Math.floor(Math.random() * MOUTH_OPTIONS.length)].id,
  };
}

export function buildAvatarUrl(seed: string, opts: AvatarOptions): string {
  const p: Record<string, string> = {
    seed,
    backgroundColor: opts.backgroundColor === "transparent" ? "" : opts.backgroundColor,
    backgroundType: opts.backgroundType,
    eyes: opts.eyes,
    mouth: opts.mouth,
  };
  const qs = Object.entries(p)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?${qs}`;
}
