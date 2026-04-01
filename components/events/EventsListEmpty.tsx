"use client";

export function EventsListEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-surface border border-border">
      <p className="text-sm text-text-secondary">No events match your filters.</p>
      <button
        type="button"
        onClick={onClear}
        className="text-sm text-accent-highlight hover:text-accent-primary font-medium transition-colors shrink-0"
      >
        Clear filters
      </button>
    </div>
  );
}
