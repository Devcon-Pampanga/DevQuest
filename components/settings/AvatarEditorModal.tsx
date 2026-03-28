"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AvatarOptions } from "@/lib/avatar";
import { BG_COLORS, EYES_OPTIONS, MOUTH_OPTIONS, buildAvatarUrl } from "@/lib/avatar";

function AvatarOptionChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-sans border transition-all"
      style={
        selected
          ? { borderColor: "#A855F7", backgroundColor: "#A855F714", color: "#A855F7", borderWidth: "2px" }
          : { borderColor: "#27272A", backgroundColor: "transparent", color: "#A1A1AA", borderWidth: "1px" }
      }
    >
      {label}
    </button>
  );
}

export function AvatarEditorModal({
  open,
  username,
  draftOptions,
  setDraftOptions,
  savingAvatar,
  onClose,
  onSave,
}: {
  open: boolean;
  username: string;
  draftOptions: AvatarOptions;
  setDraftOptions: Dispatch<SetStateAction<AvatarOptions>>;
  savingAvatar: boolean;
  onClose: () => void;
  onSave: () => void | Promise<void>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !savingAvatar && onClose()}
        role="presentation"
        style={{ animation: "fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
      />
      <div
        className="relative border border-border rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl"
        style={{ backgroundColor: "#1a1625", animation: "modal-in 350ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-heading text-[1rem] text-white">Customize Avatar</h2>
          <button
            type="button"
            onClick={() => !savingAvatar && onClose()}
            className="text-gray-300 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-minimal px-5 py-5 space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-border" style={{ backgroundColor: "#100c1a" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={buildAvatarUrl(username, draftOptions)} alt="" width={96} height={96} className="w-full h-full" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-3">Background Color</p>
            <div className="flex flex-wrap gap-2.5">
              {BG_COLORS.map(({ hex, label }) => {
                const isSelected = draftOptions.backgroundColor === hex;
                return (
                  <button
                    key={hex}
                    type="button"
                    title={label}
                    onClick={() => setDraftOptions((p) => ({ ...p, backgroundColor: hex }))}
                    className="w-7 h-7 rounded-full transition-all focus:outline-none"
                    style={
                      hex === "transparent"
                        ? {
                            background: "repeating-conic-gradient(#3f3f46 0% 25%, #2a2a3e 0% 50%) 0 0 / 8px 8px",
                            outline: isSelected ? "2px solid #A855F7" : "2px solid transparent",
                            outlineOffset: "2px",
                          }
                        : {
                            backgroundColor: `#${hex}`,
                            outline: isSelected ? "2px solid #A855F7" : "2px solid transparent",
                            outlineOffset: "2px",
                          }
                    }
                  />
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-3">Background Style</p>
            <div className="flex gap-2">
              {(
                [
                  { id: "solid" as const, label: "Solid" },
                  { id: "gradientLinear" as const, label: "Gradient" },
                ] as const
              ).map(({ id, label }) => (
                <AvatarOptionChip
                  key={id}
                  label={label}
                  selected={draftOptions.backgroundType === id}
                  onClick={() => setDraftOptions((p) => ({ ...p, backgroundType: id }))}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-3">Eyes</p>
            <div className="flex flex-wrap gap-2">
              {EYES_OPTIONS.map(({ id, label }) => (
                <AvatarOptionChip
                  key={id}
                  label={label}
                  selected={draftOptions.eyes === id}
                  onClick={() => setDraftOptions((p) => ({ ...p, eyes: id }))}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-3">Mouth</p>
            <div className="flex flex-wrap gap-2">
              {MOUTH_OPTIONS.map(({ id, label }) => (
                <AvatarOptionChip
                  key={id}
                  label={label}
                  selected={draftOptions.mouth === id}
                  onClick={() => setDraftOptions((p) => ({ ...p, mouth: id }))}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={savingAvatar}
            className="flex-1 border border-border text-text-muted hover:text-text-primary font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={savingAvatar}
            className="flex-1 bg-accent-highlight hover:bg-accent-primary text-white font-heading text-xs tracking-widest uppercase py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {savingAvatar ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
