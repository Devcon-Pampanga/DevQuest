"use client";

import Link from "next/link";

export function EventsListZero({ isCoordinator }: { isCoordinator: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent-primary/15 flex items-center justify-center animate-float">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent-highlight"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>

      <div className="flex flex-col gap-2 max-w-xs">
        <h3 className="font-heading text-xl text-text-primary">
          {isCoordinator ? "No events posted yet" : "No events yet"}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {isCoordinator
            ? "Post your chapter's first event and let volunteers start earning XP."
            : "Your coordinator will post events here when they're ready. In the meantime, keep leveling up on your quest map."}
        </p>
      </div>

      {isCoordinator ? (
        <Link
          href="/events/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-highlight hover:bg-accent-primary rounded-xl text-white text-sm font-heading font-medium transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Post your first event
        </Link>
      ) : (
        <Link
          href="/quests"
          className="flex items-center gap-1.5 px-4 py-2.5 border border-border hover:border-accent-primary/50 rounded-xl text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
        >
          Explore Quest Map
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      )}
    </div>
  );
}
