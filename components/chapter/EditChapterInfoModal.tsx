"use client";

export function EditChapterInfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl bg-elevated border border-border w-full max-w-md p-6 flex flex-col gap-5 animate-modal-in shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg text-text-primary">Edit Chapter Info</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="rounded-xl bg-accent-primary/10 border border-accent-primary/20 px-4 py-3">
          <p className="text-sm text-text-secondary leading-relaxed">
            Chapter details are managed by DEVCON PH administrators. Contact your regional
            admin to update chapter name, region, or coordinator information.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-accent-highlight hover:bg-accent-primary text-white text-sm font-heading font-medium transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
