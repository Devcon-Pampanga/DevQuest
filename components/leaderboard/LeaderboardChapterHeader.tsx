"use client";

import { CHAPTER_REGIONS } from "@/lib/chapterConstants";

export function LeaderboardChapterHeader({ viewingChapterId }: { viewingChapterId: string }) {
  const region = CHAPTER_REGIONS[viewingChapterId] ?? "Philippines";

  return (
    <div className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "0ms" }}>
      <div className="flex items-center gap-1.5 text-text-muted text-sm">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="font-heading text-sm text-text-secondary">{viewingChapterId}</span>
      </div>
      <span className="text-text-muted text-sm">·</span>
      <span className="text-text-muted text-xs">{region}</span>
      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30 text-yellow-400/60 font-sans uppercase tracking-wide shrink-0">
        Season 1
      </span>
    </div>
  );
}
