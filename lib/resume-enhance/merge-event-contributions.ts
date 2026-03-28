import type { AttendedEventForPrompt } from "./load-context";

export interface ResumeEventContributionRow {
  eventId: string;
  name: string;
  dateLabel: string;
  paragraph: string;
}

function fallbackParagraph(ev: AttendedEventForPrompt): string {
  const desc = ev.description.trim();
  const base = `Volunteered as ${ev.role} at ${ev.name}.`;
  return desc ? `${base} ${desc}` : base;
}

/**
 * Merges Gemini paragraphs with deterministic fallbacks per attended event (order matches `events`).
 */
export function mergeEventContributions(
  events: AttendedEventForPrompt[],
  gemini: { eventId: string; paragraph: string }[] | undefined
): ResumeEventContributionRow[] {
  const byId = new Map<string, string>();
  for (const g of gemini ?? []) {
    const id = typeof g.eventId === "string" ? g.eventId.trim() : "";
    const p = typeof g.paragraph === "string" ? g.paragraph.trim() : "";
    if (id && p) byId.set(id, p.slice(0, 1200));
  }

  return events.map((ev) => ({
    eventId: ev.eventId,
    name: ev.name,
    dateLabel: ev.dateLabel,
    paragraph: byId.get(ev.eventId) ?? fallbackParagraph(ev),
  }));
}
