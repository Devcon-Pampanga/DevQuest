/** XP shown as levels: each band is 500 XP (Level 1 = 0–499, Level 2 = 500–999, …). */

export const XP_LEVEL_STEP = 500;

export interface XpLevelProgress {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  pctToNextLevel: number;
}

export function getXpLevelProgress(xpRaw: number): XpLevelProgress {
  const xp = Math.max(0, Math.floor(Number(xpRaw) || 0));
  const level = Math.floor(xp / XP_LEVEL_STEP) + 1;
  const startXp = (level - 1) * XP_LEVEL_STEP;
  const xpIntoLevel = xp - startXp;
  const xpToNextLevel = Math.max(0, startXp + XP_LEVEL_STEP - xp);
  const pctToNextLevel = Math.min(100, Math.max(0, (xpIntoLevel / XP_LEVEL_STEP) * 100));
  return { level, xpIntoLevel, xpToNextLevel, pctToNextLevel };
}
