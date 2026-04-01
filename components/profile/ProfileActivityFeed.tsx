"use client";

import { relativeTime } from "@/lib/time";
import { xpLogSourceIconColor } from "@/lib/xpLogDisplay";
import { XPLogEntry } from "@/types/xp";

export function ProfileActivityFeed({
  entries,
  hasMore,
}: {
  entries: XPLogEntry[];
  hasMore: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-lg text-text-primary">Activity</h3>
        {hasMore ? (
          <button
            type="button"
            disabled
            title="Coming soon"
            className="text-xs font-heading text-text-muted cursor-not-allowed opacity-50"
          >
            View All
          </button>
        ) : null}
      </div>
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-text-muted gap-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center animate-float">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>
          <p className="font-heading text-text-secondary">No activity yet</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((e, i) => {
            const bg = xpLogSourceIconColor(e.source);
            const ts = e.createdAt;
            return (
              <li key={`${e.logId ?? ts?.toMillis?.() ?? i}-${i}`} className="flex gap-3 items-start" style={{ animation: `fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(i, 7) * 45}ms both` }}>
                <div
                  className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${bg}33` }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bg }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-sans leading-snug">{e.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-accent-highlight font-heading font-semibold">+{e.xp} XP</span>
                    {ts ? (
                      <span className="text-xs text-text-muted font-sans">{relativeTime(ts)}</span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
