"use client";

import { useState, useEffect } from "react";
import type { EventDoc, EventRole, EditEventFields } from "@/lib/events/types";
import {
  timestampToDateInput,
  timestampToTimeInput,
} from "@/lib/events/eventDetailFormat";
import { IconX, IconCheck, IconUpload } from "./EventDetailIcons";
import { WAVE_COLORS } from "./constants";

const EDIT_INPUT =
  "w-full bg-base border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-highlight transition-shadow";

const EDIT_LABEL =
  "block text-[11px] font-sans uppercase tracking-widest text-text-secondary mb-2";

export function EditEventModal({
  event,
  onSave,
  onClose,
  saving,
}: {
  event: EventDoc;
  onSave: (fields: EditEventFields, bannerFile: File | null) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [fields, setFields] = useState<EditEventFields>({
    name: event.name,
    description: event.description ?? "",
    date: timestampToDateInput(event.date),
    startTime: timestampToTimeInput(event.date),
    endTime: event.endDate ? timestampToTimeInput(event.endDate) : "",
    location: event.location,
    lumaUrl: event.lumaUrl ?? "",
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  function set(key: keyof EditEventFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setBannerFile(file);
    if (file) setBannerPreview(URL.createObjectURL(file));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-elevated overflow-hidden shadow-2xl animate-modal-in">
        <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #7C3AED, #A855F7)" }} />

        <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-minimal">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-xl text-white">Edit Event</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
              <IconX />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className={EDIT_LABEL}>Event Name *</label>
              <input type="text" value={fields.name} onChange={(e) => set("name", e.target.value)} className={EDIT_INPUT} />
            </div>

            <div>
              <label className={EDIT_LABEL}>Description</label>
              <textarea rows={3} value={fields.description} onChange={(e) => set("description", e.target.value)} className={`${EDIT_INPUT} resize-none`} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={EDIT_LABEL}>Date *</label>
                <input type="date" value={fields.date} onChange={(e) => set("date", e.target.value)} className={EDIT_INPUT} style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className={EDIT_LABEL}>Start Time</label>
                <input type="time" value={fields.startTime} onChange={(e) => set("startTime", e.target.value)} className={EDIT_INPUT} style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className={EDIT_LABEL}>End Time</label>
                <input type="time" value={fields.endTime} onChange={(e) => set("endTime", e.target.value)} className={EDIT_INPUT} style={{ colorScheme: "dark" }} />
              </div>
            </div>

            <div>
              <label className={EDIT_LABEL}>Location *</label>
              <input type="text" value={fields.location} onChange={(e) => set("location", e.target.value)} className={EDIT_INPUT} />
            </div>

            <div>
              <label className={EDIT_LABEL}>Luma Link</label>
              <input type="url" value={fields.lumaUrl} onChange={(e) => set("lumaUrl", e.target.value)} className={EDIT_INPUT} placeholder="https://lu.ma/your-event" />
            </div>

            <div>
              <label className={EDIT_LABEL}>Banner Image</label>
              <div className="rounded-xl overflow-hidden border border-border bg-base">
                {(bannerPreview || event.bannerUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bannerPreview ?? event.bannerUrl}
                    alt="Banner preview"
                    className="w-full h-28 object-cover opacity-80"
                  />
                )}
                <label className="flex items-center justify-center gap-2 py-3 cursor-pointer hover:bg-white/5 transition-colors text-sm text-text-secondary hover:text-text-primary">
                  <IconUpload />
                  {bannerFile ? bannerFile.name : "Replace banner…"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary text-sm font-heading transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(fields, bannerFile)}
              disabled={saving || !fields.name.trim() || !fields.date || !fields.location.trim()}
              className="flex-1 py-3 rounded-xl bg-[#A855F7] hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-heading transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-white animate-[wave-dot_0.6s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              ) : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoleModal({
  roles,
  slotCounts,
  onConfirm,
  onClose,
  loading,
}: {
  roles: EventRole[];
  slotCounts: Record<string, number>;
  onConfirm: (role: EventRole) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<EventRole | null>(null);

  const available = roles.filter((r) => (slotCounts[r.roleName] ?? 0) < r.slots);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-elevated border border-border rounded-2xl p-6 shadow-2xl animate-modal-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-xl text-text-primary">Choose Your Role</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
            <IconX />
          </button>
        </div>

        {available.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-6">All roles are fully booked.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-5">
            {available.map((role) => {
              const filled = slotCounts[role.roleName] ?? 0;
              const remaining = role.slots - filled;
              const isSelected = selected?.roleName === role.roleName;
              return (
                <button
                  key={role.roleName}
                  onClick={() => setSelected(role)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-accent-highlight bg-accent-highlight/10"
                      : "border-border bg-surface hover:border-accent-primary/50"
                  }`}
                >
                  <div>
                    <span className={`font-heading text-sm ${isSelected ? "text-text-primary" : "text-text-secondary"}`}>
                      {role.roleName}
                    </span>
                    <p className="text-xs text-text-muted mt-0.5">{remaining} slot{remaining !== 1 ? "s" : ""} left</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-accent-highlight">+{role.xpReward} XP</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-accent-highlight flex items-center justify-center">
                        <IconCheck />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected || loading}
          className="w-full py-3 bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-heading font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          ) : (
            "Confirm Registration"
          )}
        </button>
      </div>
    </div>
  );
}

export function QrScannerModal({
  onScan,
  onClose,
}: {
  onScan: (data: string) => void;
  onClose: () => void;
}) {
  const [scannerReady, setScannerReady] = useState(false);
  const [scanError, setScanError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let qrInstance: { stop: () => Promise<void> } | null = null;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const container = document.getElementById("qr-reader");
        if (container) container.innerHTML = "";
        const qr = new Html5Qrcode("qr-reader");
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            onScan(decodedText);
            try {
              qr.stop().catch(() => {});
            } catch {
              /* scanner already stopped */
            }
          },
          () => {}
        );
        if (cancelled) {
          qr.stop().catch(() => {});
          return;
        }
        qrInstance = qr;
        setScannerReady(true);
      } catch {
        if (!cancelled) setScanError("Camera not available or permission denied.");
      }
    })();

    return () => {
      cancelled = true;
      try {
        qrInstance?.stop().catch(() => {});
      } catch {
        /* ignore */
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-elevated border border-border rounded-2xl p-6 shadow-2xl animate-modal-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-text-primary">Scan Volunteer QR</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
            <IconX />
          </button>
        </div>
        <p className="text-xs text-text-muted mb-4">Point the camera at a volunteer&apos;s DevQuest QR code.</p>

        {scanError ? (
          <div className="text-center py-8 text-red-400 text-sm">{scanError}</div>
        ) : (
          <div id="qr-reader" className="rounded-xl overflow-hidden" />
        )}

        {!scannerReady && !scanError && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-elevated">
            <div className="flex gap-1.5">
              {WAVE_COLORS.map((color, i) => (
                <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
