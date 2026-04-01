"use client";

import { useRef, useState } from "react";
import { CHAPTERS, shortChapter } from "@/lib/chapterConstants";
import { useDismissOnOutsideClick } from "@/hooks/useDismissOnOutsideClick";
import type { ChapterSessionUser } from "@/types/chapter";

export function ChapterSwitcherDropdown({
  currentUser,
  viewingChapterId,
  setViewingChapterId,
}: {
  currentUser: ChapterSessionUser | null;
  viewingChapterId: string;
  setViewingChapterId: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(dropdownRef, open, setOpen);

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-heading border transition-colors ${
          open
            ? "bg-accent-primary/20 border-accent-primary text-accent-highlight"
            : "border-border text-text-secondary hover:text-text-primary hover:border-text-secondary bg-surface"
        }`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="hidden sm:inline truncate max-w-[120px]">
          {viewingChapterId ? shortChapter(viewingChapterId) : "Chapter"}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl border border-border bg-elevated shadow-2xl py-2 min-w-[220px] animate-modal-in">
          {CHAPTERS.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => {
                setViewingChapterId(ch);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                viewingChapterId === ch
                  ? "text-accent-highlight bg-accent-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              <span>{ch}</span>
              {ch === currentUser?.chapterId && (
                <span className="text-[9px] text-accent-highlight font-sans uppercase tracking-wide">
                  yours
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
