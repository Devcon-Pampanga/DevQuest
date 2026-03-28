/** Parse devquest://attendance?... QR payload. Returns null if invalid. */
export function parseAttendanceQrData(data: string): {
  eventId: string;
  userId: string;
} | null {
  if (!data.startsWith("devquest://attendance?")) return null;
  try {
    const url = new URL(data.replace("devquest://", "https://devquest.app/"));
    const eventId = url.searchParams.get("eventId");
    const userId = url.searchParams.get("userId");
    if (!eventId || !userId) return null;
    return { eventId, userId };
  } catch {
    return null;
  }
}

export function isDevQuestQr(data: string): boolean {
  return data.startsWith("devquest://");
}
