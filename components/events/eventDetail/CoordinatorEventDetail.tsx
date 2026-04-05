"use client";

import Link from "next/link";
import type { Timestamp } from "firebase/firestore";
import type { EditEventFields, EventDoc, EventRegistration } from "@/lib/events/types";
import type { CoordTab } from "@/hooks/useEventDetailPage";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { IconBack, IconCheck, IconDownload, IconEdit, IconQr, IconTrash, IconX } from "./EventDetailIcons";
import { EditEventModal, QrScannerModal } from "./EventDetailModals";
import { EventHeaderCard } from "./EventHeaderCard";
import { EventRolesSection } from "./EventRolesSection";
import { ReflectionDataPreview } from "./ReflectionDataPreview";

interface CoordinatorEventDetailProps {
  event: EventDoc;
  allRegs: EventRegistration[];
  slotCounts: Record<string, number>;
  coordTab: CoordTab;
  setCoordTab: (t: CoordTab) => void;
  roleFilter: string | null;
  setRoleFilter: (r: string | null) => void;
  confirmingId: string | null;
  confirmingAll: boolean;
  scanFeedback: { ok: boolean; msg: string } | null;
  showQrScanner: boolean;
  setShowQrScanner: (v: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (v: boolean) => void;
  saving: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  deleting: boolean;
  onSaveEdit: (fields: EditEventFields, bannerFile: File | null) => void;
  onDelete: () => void;
  onExportCsv: () => void;
  onConfirmAttendance: (reg: EventRegistration) => void;
  onConfirmAll: () => void;
  onQrScan: (data: string) => void;
  avatarUrl: string;
  upcoming: boolean;
  totalSlots: number;
  totalFilled: number;
  confirmed: number;
  reflections: number;
  timeLabel: string;
  formatDate: (ts: Timestamp) => string;
}

export function CoordinatorEventDetail({
  event,
  allRegs,
  slotCounts,
  coordTab,
  setCoordTab,
  roleFilter,
  setRoleFilter,
  confirmingId,
  confirmingAll,
  scanFeedback,
  showQrScanner,
  setShowQrScanner,
  showEditModal,
  setShowEditModal,
  saving,
  showDeleteConfirm,
  setShowDeleteConfirm,
  deleting,
  onSaveEdit,
  onDelete,
  onExportCsv,
  onConfirmAttendance,
  onConfirmAll,
  onQrScan,
  avatarUrl,
  upcoming,
  totalSlots,
  totalFilled,
  confirmed,
  reflections,
  timeLabel,
  formatDate,
}: CoordinatorEventDetailProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/events" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <IconBack />
          </Link>
          <h1 className="font-heading text-xl text-text-primary tracking-wide truncate min-w-0">{event.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors text-sm font-heading"
          >
            <IconEdit />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-red-400 hover:border-red-500/40 transition-colors text-sm font-heading"
          >
            <IconTrash />
            Delete
          </button>
          <Link href="/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="Profile" width={36} height={36} className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors" />
          </Link>
        </div>
      </div>

      <div className="flex border-b border-border px-6">
        {(["details", "volunteers", "reflections"] as CoordTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setCoordTab(tab)}
            className={`px-4 py-3 text-sm font-heading font-medium capitalize transition-colors border-b-2 -mb-px ${
              coordTab === tab
                ? "border-accent-highlight text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab === "volunteers"
              ? `${event.isInternal ? "Attendees" : "Volunteers"} (${allRegs.length})`
              : tab === "reflections"
              ? `Reflections${reflections > 0 ? ` (${reflections})` : ""}`
              : "Details"}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6">
        {coordTab === "details" && (
          <div key="details" className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5">
            <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
              <EventHeaderCard
                event={event}
                upcoming={upcoming}
                totalFilled={totalFilled}
                totalSlots={totalSlots}
                timeLabel={timeLabel}
                formatDate={formatDate}
              />
            </div>
            <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
              <EventRolesSection event={event} slotCounts={slotCounts} />
            </div>
          </div>
        )}

        {coordTab === "volunteers" && (
          <div key="volunteers" className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-surface border border-border p-4 flex flex-col gap-1 animate-fade-up" style={{ animationDelay: "0ms" }}>
                <span className="text-3xl font-heading font-bold text-accent-highlight tabular-nums">{allRegs.length}</span>
                <span className="text-xs text-text-muted">Registered</span>
              </div>
              <div className="rounded-2xl bg-surface border border-border p-4 flex flex-col gap-1 animate-fade-up" style={{ animationDelay: "60ms" }}>
                <span className="text-3xl font-heading font-bold text-team-community tabular-nums">{confirmed}</span>
                <span className="text-xs text-text-muted">Confirmed</span>
              </div>
              <div className="rounded-2xl bg-surface border border-border p-4 flex flex-col gap-1 animate-fade-up" style={{ animationDelay: "120ms" }}>
                <span className="text-3xl font-heading font-bold text-team-sustainability tabular-nums">{reflections}</span>
                <span className="text-xs text-text-muted">Reflections</span>
              </div>
            </div>

            {event.roles.length > 1 && (
              <div className="flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "140ms" }}>
                <button
                  type="button"
                  onClick={() => setRoleFilter(null)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all duration-100 active:scale-95 ${
                    roleFilter === null ? "bg-accent-highlight text-white" : "border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50"
                  }`}
                >
                  All ({allRegs.length})
                </button>
                {event.roles.map((r) => {
                  const count = allRegs.filter((reg) => reg.role === r.roleName).length;
                  return (
                    <button
                      key={r.roleName}
                      type="button"
                      onClick={() => setRoleFilter(r.roleName)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-all duration-100 active:scale-95 ${
                        roleFilter === r.roleName ? "bg-accent-highlight text-white" : "border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50"
                      }`}
                    >
                      {r.roleName} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 flex-wrap animate-fade-up" style={{ animationDelay: "180ms" }}>
              <button
                type="button"
                onClick={() => setShowQrScanner(true)}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-accent-primary/50 rounded-xl text-sm text-text-secondary hover:text-text-primary transition-all duration-100 active:scale-95"
              >
                <IconQr />
                Scan QR
              </button>
              <button
                type="button"
                onClick={onConfirmAll}
                disabled={confirmingAll || allRegs.filter((r) => !r.attended).length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-accent-primary/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm text-text-secondary hover:text-text-primary transition-all duration-100 active:scale-95"
              >
                {confirmingAll ? (
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                ) : (
                  <IconCheck />
                )}
                Confirm All
              </button>
              <button
                type="button"
                onClick={onExportCsv}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-accent-primary/50 rounded-xl text-sm text-text-secondary hover:text-text-primary transition-all duration-100 active:scale-95"
              >
                <IconDownload />
                Export CSV
              </button>
            </div>

            {(() => {
              const filteredRegs = roleFilter ? allRegs.filter((r) => r.role === roleFilter) : allRegs;
              return allRegs.length === 0 ? (
                <div className="text-center py-16 text-text-muted text-sm">No volunteers registered yet.</div>
              ) : filteredRegs.length === 0 ? (
                <div className="text-center py-16 text-text-muted text-sm">No volunteers in this role.</div>
              ) : (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  {filteredRegs.map((reg, idx) => (
                    <div
                      key={reg.userId}
                      className={`flex items-center gap-4 px-5 py-4 animate-fade-up ${idx < filteredRegs.length - 1 ? "border-b border-border" : ""}`}
                      style={{ animationDelay: `${Math.min(idx, 8) * 50}ms` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={buildAvatarUrl(reg.username ?? reg.userId, reg.avatarOptions ?? DEFAULT_AVATAR)}
                        alt=""
                        width={36}
                        height={36}
                        className="rounded-xl border border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary font-medium truncate">{reg.username ?? reg.userId}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-text-muted">{reg.role}</span>
                          <span className="text-xs text-accent-highlight font-semibold">+{reg.roleXP} XP</span>
                          {reg.reflectionSubmitted && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-team-community/15 text-team-community">Reflected</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {reg.attended ? (
                          <span className="flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-xl bg-team-sustainability/15 text-team-sustainability font-heading font-medium animate-modal-in">
                            <IconCheck /> Confirmed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onConfirmAttendance(reg)}
                            disabled={confirmingId === reg.userId}
                            className="text-sm px-4 py-2 bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 rounded-xl text-white font-heading font-medium transition-all duration-100 active:scale-95 flex items-center gap-1.5"
                          >
                            {confirmingId === reg.userId ? (
                              <span className="flex gap-1">
                                {[0, 1, 2, 3].map((i) => (
                                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
                                ))}
                              </span>
                            ) : (
                              "Confirm"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

          </div>
        )}

        {coordTab === "reflections" && (
          <div key="reflections" className="max-w-2xl mx-auto flex flex-col gap-4">
            <ReflectionDataPreview registrations={allRegs} />
          </div>
        )}
      </div>

      {showQrScanner && <QrScannerModal onScan={onQrScan} onClose={() => setShowQrScanner(false)} />}

      {showEditModal && event && (
        <EditEventModal event={event} onSave={onSaveEdit} onClose={() => setShowEditModal(false)} saving={saving} />
      )}

      {scanFeedback && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg whitespace-nowrap animate-modal-in ${
            scanFeedback.ok ? "bg-team-sustainability/20 border border-team-sustainability/40 text-team-sustainability" : "bg-red-500/20 border border-red-500/40 text-red-400"
          }`}
        >
          {scanFeedback.ok ? <IconCheck /> : <IconX size={14} />}
          {scanFeedback.msg}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteConfirm(false)} />
          <div className="relative z-10 w-full max-w-sm border border-border bg-elevated rounded-2xl overflow-hidden shadow-2xl animate-modal-in">
            <div className="h-[3px] w-full bg-red-600" />
            <div className="p-6">
              <h3 className="font-heading text-xl text-text-primary mb-2">Delete Event?</h3>
              <p className="text-sm text-text-secondary mb-6">
                This will permanently delete <strong className="text-text-primary">{event?.name}</strong> and cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary text-sm font-heading transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-heading transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  ) : (
                    "Delete Event"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
