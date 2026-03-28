import type { EventRegistration } from "./types";

export function exportVolunteersCsv(eventName: string, rows: EventRegistration[]): void {
  const header = "Username,Role,XP,Attended,Reflection Submitted";
  const lines = rows.map((r) =>
    [r.username ?? r.userId, r.role, r.roleXP, r.attended, r.reflectionSubmitted].join(",")
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${eventName}-volunteers.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
