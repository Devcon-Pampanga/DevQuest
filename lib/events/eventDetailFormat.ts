import { Timestamp } from "firebase/firestore";

export function formatEventDate(ts: Timestamp): string {
  return ts.toDate().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventTime(ts: Timestamp): string {
  return ts.toDate().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function hoursUntil(ts: Timestamp): number {
  return Math.max(0, Math.floor((ts.toDate().getTime() - Date.now()) / 3600000));
}

export function isEventUpcoming(ts: Timestamp): boolean {
  return ts.toDate() > new Date();
}

export function timestampToDateInput(ts: Timestamp): string {
  return ts.toDate().toISOString().slice(0, 10);
}

export function timestampToTimeInput(ts: Timestamp): string {
  const d = ts.toDate();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
