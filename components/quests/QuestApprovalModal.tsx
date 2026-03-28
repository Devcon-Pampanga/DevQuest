"use client";

/** Coordinator approve / revision controls (inline in the approval card, not an overlay). */

export interface QuestApprovalModalProps {
  revising: boolean;
  revNote: string;
  onRevNoteChange: (value: string) => void;
  onStartRevise: () => void;
  onSendRevise: () => void;
  onCancelRevise: () => void;
  onApprove: () => void;
  submitting: boolean;
}

export function QuestApprovalModal({
  revising,
  revNote,
  onRevNoteChange,
  onStartRevise,
  onSendRevise,
  onCancelRevise,
  onApprove,
  submitting,
}: QuestApprovalModalProps) {
  return (
    <>
      {revising && (
        <textarea
          value={revNote}
          onChange={(e) => onRevNoteChange(e.target.value)}
          placeholder="Explain what the volunteer needs to revise…"
          rows={3}
          className="w-full rounded-xl bg-[#16213e] border border-orange-500/30 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-orange-500/60 transition-colors"
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl text-sm font-heading font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 transition-colors"
        >
          Approve
        </button>
        {!revising ? (
          <button
            type="button"
            onClick={onStartRevise}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-heading font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 disabled:opacity-50 transition-colors"
          >
            Request Revision
          </button>
        ) : (
          <div className="flex gap-2 flex-1">
            <button
              type="button"
              onClick={onSendRevise}
              disabled={submitting || !revNote.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-heading font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
            <button
              type="button"
              onClick={onCancelRevise}
              className="px-3 py-2.5 rounded-xl text-sm text-zinc-400 bg-zinc-800/40 hover:bg-zinc-700/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  );
}
