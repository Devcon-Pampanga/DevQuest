"use client";

interface SuccessToastProps {
  onClose: () => void;
  onViewReceipt: () => void;
}

export function SuccessToast({ onClose, onViewReceipt }: SuccessToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-red-500/30 bg-[#13131f] px-5 py-4 shadow-xl shadow-red-950/20">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-lg text-red-400">OK</div>
      <div>
        <p className="text-sm font-semibold text-white">Redemption successful!</p>
        <p className="text-xs text-gray-400">Your receipt is ready to view.</p>
      </div>
      <button
        type="button"
        onClick={onViewReceipt}
        className="ml-2 rounded-lg border border-red-500/30 bg-red-600/20 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-600/30"
      >
        View Receipt
      </button>
      <button type="button" onClick={onClose} className="text-xs text-gray-500 transition hover:text-white">
        x
      </button>
    </div>
  );
}
