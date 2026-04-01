/** In-memory throttle; resets on server cold start. Good enough for basic cost control. */
const lastByUid = new Map<string, number>();

export function peekResumeEnhanceRateLimit(uid: string, minIntervalMs: number): boolean {
  const now = Date.now();
  const prev = lastByUid.get(uid) ?? 0;
  return now - prev >= minIntervalMs;
}

/** Call only after a successful enhancement response (avoids locking out retries on 5xx). */
export function markResumeEnhanceRateLimit(uid: string): void {
  lastByUid.set(uid, Date.now());
}
