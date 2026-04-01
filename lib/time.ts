import { Timestamp } from "firebase/firestore";

export function relativeTime(ts: Timestamp): string {
  const d = ts.toDate();
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const t = d.getTime();
  if (t >= startToday.getTime()) return "Today";
  if (t >= startYesterday.getTime()) return "Yesterday";
  const diffMs = startToday.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks <= 8) return `${weeks}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
