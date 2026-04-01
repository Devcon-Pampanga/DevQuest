import type { Timestamp } from "firebase/firestore";
import { formatEventDate } from "@/lib/chapterConstants";

/** Relative labels for upcoming events on the events list (Today, Tomorrow, weekday, or formatted date). */
export function formatRelativeDate(ts: Timestamp): string {
  const now = new Date();
  const d = ts.toDate();
  if (d <= now) return formatEventDate(ts);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((eventMidnight.getTime() - todayMidnight.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `This ${d.toLocaleDateString("en-US", { weekday: "long" })}`;
  return formatEventDate(ts);
}
