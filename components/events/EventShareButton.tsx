"use client";

import { createPortal } from "react-dom";
import { useShareLinkCopy } from "@/hooks/useShareLinkCopy";
import { IconShare } from "@/components/events/eventDetail/EventDetailIcons";

export function EventShareButton({
  eventId,
  variant = "badge",
}: {
  eventId: string;
  variant?: "badge" | "icon";
}) {
  const { copied, copyUrl } = useShareLinkCopy();

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    copyUrl(`${window.location.origin}/events/${eventId}`);
  }

  const snackbar =
    copied && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-snackbar">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-elevated/95 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="rgba(34,197,94,0.15)" stroke="#22C55E" strokeWidth="1.5" />
                <polyline points="8 12 11 15 16 9" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-text-primary whitespace-nowrap">Link copied!</span>
            </div>
          </div>,
          document.body
        )
      : null;

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={handleShare}
          title="Copy link"
          className="p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
        >
          <IconShare />
        </button>
        {snackbar}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="text-xs px-2.5 py-0.5 rounded-full border border-border text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
      >
        Copy link
      </button>
      {snackbar}
    </>
  );
}
