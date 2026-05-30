"use client";

import { useState, useEffect } from "react";
import type { EventDoc, EventRole, EditEventFields, EventRegistration } from "@/lib/events/types";
import { DEFAULT_ROLES } from "@/lib/eventNewConstants";
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

function computeRemovalCount(
  oldRoles: EventRole[],
  newRoles: EventRole[],
  allRegs: EventRegistration[]
): number {
  const newSlotsMap = new Map(newRoles.map((r) => [r.roleName, r.slots]));
  let count = 0;
  for (const oldRole of oldRoles) {
    const unattended = allRegs.filter(
      (r) => r.role === oldRole.roleName && !r.attended
    );
    if (!newSlotsMap.has(oldRole.roleName)) {
      count += unattended.length;
    } else {
      count += Math.max(0, unattended.length - newSlotsMap.get(oldRole.roleName)!);
    }
  }
  return count;
}

export function EditEventModal({
  event,
  onSave,
  onClose,
  saving,
  allRegs,
}: {
  event: EventDoc;
  onSave: (fields: EditEventFields, bannerFile: File | null) => void;
  onClose: () => void;
  saving: boolean;
  allRegs: EventRegistration[];
}) {
  const [fields, setFields] = useState<EditEventFields>({
    name: event.name,
    description: event.description ?? "",
    date: timestampToDateInput(event.date),
    startTime: timestampToTimeInput(event.date),
    endTime: event.endDate ? timestampToTimeInput(event.endDate) : "",
    location: event.location,
    lumaUrl: event.lumaUrl ?? "",
    roles: event.roles.map((r) => ({ ...r })),
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [showAddRole, setShowAddRole] = useState(false);

  function set(key: keyof Omit<EditEventFields, "roles">, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function adjustRoleSlots(roleName: string, delta: number) {
    setFields((prev) => ({
      ...prev,
      roles: prev.roles.map((r) =>
        r.roleName === roleName ? { ...r, slots: Math.max(1, r.slots + delta) } : r
      ),
    }));
  }

  function removeRoleFromEdit(roleName: string) {
    setFields((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.roleName !== roleName),
    }));
  }

  function addRoleToEdit(roleId: string) {
    const template = DEFAULT_ROLES.find((r) => r.id === roleId);
    if (!template) return;
    setFields((prev) => ({
      ...prev,
      roles: [
        ...prev.roles,
        { roleName: template.roleName, slots: template.slots, xpReward: template.xpReward },
      ],
    }));
    setShowAddRole(false);
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setBannerFile(file);
    if (file) setBannerPreview(URL.createObjectURL(file));
  }

  const removalCount = computeRemovalCount(event.roles, fields.roles, allRegs);

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
              <label className={EDIT_LABEL}>Volunteer Roles</label>

              <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto_auto_24px] gap-2 px-1">
                <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Role</span>
                <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">XP</span>
                <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted text-center">Slots</span>
                <span />
              </div>

              <div className="flex flex-col gap-2">
                {fields.roles.map((role) => (
                  <div
                    key={role.roleName}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto_24px] items-center gap-2 rounded-xl border border-border px-2.5 py-2.5"
                    style={{ backgroundColor: "#252038" }}
                  >
                    <span className="truncate text-sm text-text-primary font-sans">{role.roleName}</span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0"
                      style={{ color: "#A855F7", borderColor: "#A855F760", backgroundColor: "#A855F718" }}
                    >
                      +{role.xpReward} XP
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustRoleSlots(role.roleName, -1)}
                        className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-white/8 transition-colors text-sm leading-none select-none"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs text-text-primary tabular-nums select-none">{role.slots}</span>
                      <button
                        type="button"
                        onClick={() => adjustRoleSlots(role.roleName, +1)}
                        className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-white/8 transition-colors text-sm leading-none select-none"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRoleFromEdit(role.roleName)}
                      className="flex items-center justify-center w-6 h-6 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <IconX />
                    </button>
                  </div>
                ))}
              </div>

              {(() => {
                const available = DEFAULT_ROLES.filter(
                  (r) => !fields.roles.some((existing) => existing.roleName === r.roleName)
                );
                const allAdded = available.length === 0;
                return (
                  <div className="mt-3">
                    {showAddRole && !allAdded ? (
                      <select
                        autoFocus
                        defaultValue=""
                        onChange={(e) => { if (e.target.value) addRoleToEdit(e.target.value); }}
                        onBlur={() => setShowAddRole(false)}
                        className={`${EDIT_INPUT} pr-10`}
                        style={{ colorScheme: "dark" }}
                      >
                        <option value="" disabled>Select a role to add…</option>
                        {available.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.roleName} (+{r.xpReward} XP)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddRole(true)}
                        disabled={allAdded}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-heading transition-colors ${
                          allAdded
                            ? "opacity-40 cursor-not-allowed border-border text-text-muted"
                            : "border-accent-primary/50 text-accent-highlight hover:bg-accent-primary/10"
                        }`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Role
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

          </div>

          {removalCount > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/8 px-4 py-3 text-sm text-yellow-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {removalCount} unconfirmed volunteer{removalCount !== 1 ? "s" : ""} will be removed
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary text-sm font-heading transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(fields, bannerFile)}
              disabled={saving || !fields.name.trim() || !fields.date || !fields.location.trim() || fields.roles.length === 0}
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
  title = "Choose Your Role",
  confirmLabel = "Confirm Registration",
  excludeRole,
}: {
  roles: EventRole[];
  slotCounts: Record<string, number>;
  onConfirm: (role: EventRole) => void;
  onClose: () => void;
  loading: boolean;
  title?: string;
  confirmLabel?: string;
  excludeRole?: string;
}) {
  const [selected, setSelected] = useState<EventRole | null>(null);

  const available = roles.filter(
    (r) => (slotCounts[r.roleName] ?? 0) < r.slots && r.roleName !== excludeRole
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-elevated border border-border rounded-2xl p-6 shadow-2xl animate-modal-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-xl text-text-primary">{title}</h3>
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
            confirmLabel
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
