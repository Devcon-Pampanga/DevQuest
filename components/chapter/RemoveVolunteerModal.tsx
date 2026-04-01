"use client";

export function RemoveVolunteerModal({
  target,
  removing,
  onCancel,
  onConfirm,
}: {
  target: { uid: string; username: string } | null;
  removing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl bg-elevated border border-border w-full max-w-sm p-6 flex flex-col gap-5 animate-modal-in shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f87171"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="font-heading text-base text-text-primary">Remove Volunteer</h3>
            <p className="text-sm text-text-secondary mt-1 leading-relaxed">
              Remove{" "}
              <span className="text-text-primary font-medium">{target.username}</span>{" "}
              from this chapter? They will no longer appear in chapter stats or leaderboards.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={removing}
            className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary text-sm font-heading transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={removing}
            className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-heading font-medium transition-colors border border-red-500/30 disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
