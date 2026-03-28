"use client";

import { CHAPTER_REGIONS } from "@/lib/chapterConstants";

export function ChapterHero({
  chapterId,
  canEdit,
  onEdit,
}: {
  chapterId: string;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const region = CHAPTER_REGIONS[chapterId] ?? "Philippines";

  return (
    <div
      className="relative rounded-2xl overflow-hidden animate-fade-up"
      style={{
        background: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 45%, #A855F7 80%, #C084FC 100%)",
        animationDelay: "0ms",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-purple-200/60 text-[10px] font-sans uppercase tracking-[0.18em] mb-2">
            Chapter
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl text-white leading-tight">
            {chapterId}
          </h2>
          <div className="flex items-center gap-1.5 mt-2.5 text-purple-100/70 text-sm">
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
            <span>{region}</span>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-heading transition-colors backdrop-blur-sm border border-white/20 shrink-0"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
