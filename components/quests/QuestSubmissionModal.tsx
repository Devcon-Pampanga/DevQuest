"use client";

/** Inline submission form for coordinator_approval quests (rendered inside the expanded quest tile, not an overlay). */

export interface QuestSubmissionModalProps {
  notes: string;
  onNotesChange: (value: string) => void;
  evidence: string;
  onEvidenceChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function QuestSubmissionModal({
  notes,
  onNotesChange,
  evidence,
  onEvidenceChange,
  onSubmit,
  submitting,
}: QuestSubmissionModalProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
          Evidence &amp; Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Describe what you did, link to your work, or provide any relevant context…"
          rows={3}
          className="w-full rounded-xl bg-[#0a0a0f] border border-[#27272A] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-primary/60 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
          Link (optional)
        </label>
        <input
          type="url"
          value={evidence}
          onChange={(e) => onEvidenceChange(e.target.value)}
          placeholder="https://drive.google.com/…"
          className="w-full rounded-xl bg-[#0a0a0f] border border-[#27272A] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/60 transition-colors"
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || !notes.trim()}
        className="w-full py-3.5 rounded-xl font-heading font-semibold text-white bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting…" : "Submit for Approval"}
      </button>
    </div>
  );
}
