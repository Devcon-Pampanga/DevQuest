"use client";

interface SuccessToastProps {
  onClose: () => void;
  onViewReceipt: () => void;
}

export function SuccessToast({ onClose, onViewReceipt }: SuccessToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-elevated px-5 py-4 shadow-xl shadow-black/40">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-primary/40 bg-accent-primary/20 text-sm font-heading font-bold text-accent-highlight">
        OK
      </div>
      <div>
        <p className="text-sm font-heading font-medium text-text-primary">Redemption successful!</p>
        <p className="text-xs text-text-secondary">Your receipt is ready to view.</p>
      </div>
      <button
        type="button"
        onClick={onViewReceipt}
        className="ml-2 rounded-lg border border-accent-primary/40 bg-accent-primary/15 px-3 py-1.5 text-xs font-heading font-medium text-accent-highlight transition hover:bg-accent-primary/25"
      >
        View Receipt
      </button>
      <button type="button" onClick={onClose} className="text-xs text-text-muted transition hover:text-text-primary">
        x
      </button>
    </div>
  );
}
