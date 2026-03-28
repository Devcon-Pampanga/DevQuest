"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User as FirebaseUser } from "firebase/auth";
import { FormSectionCard } from "@/components/forms/FormSectionCard";
import { IconBack, IconChevron, IconX } from "@/components/forms/FormIcons";
import { INPUT_CLS, LABEL_CLS } from "@/lib/formFieldClasses";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import { isoToDateInput, isoToTimeInput } from "@/lib/eventDateInputs";
import {
  ATTENDEE_XP_TIERS,
  DEFAULT_ROLES,
  EVENT_SCALES,
  EVENT_TYPES,
  INTERNAL_EVENT_TYPES,
  NEW_EVENT_WAVE_COLORS,
  buildRolesFromPreset,
  type EventScale,
  type RoleEntry,
} from "@/lib/eventNewConstants";
import { submitNewEvent } from "@/lib/eventCreate";
import type { ChapterSessionUser } from "@/types/chapter";
import { EventSuccessOverlay } from "./EventSuccessOverlay";

export function NewEventView({
  userData,
  firebaseUser,
}: {
  userData: ChapterSessionUser;
  firebaseUser: FirebaseUser;
}) {
  const router = useRouter();

  // Luma import
  const [lumaExpanded, setLumaExpanded] = useState(false);
  const [lumaUrl, setLumaUrl] = useState("");
  const [lumaLoading, setLumaLoading] = useState(false);
  const [lumaError, setLumaError] = useState("");
  const [lumaSuccess, setLumaSuccess] = useState(false);

  // Form fields
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [lumaLink, setLumaLink] = useState("");

  // Banner
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");

  // Roles — coordinator only edits slot counts
  const [roles, setRoles] = useState<RoleEntry[]>([]);

  // Scale + preset system
  const [eventScale, setEventScale] = useState("");
  const hasCustomRoles = useRef(false);
  const [presetPending, setPresetPending] = useState<{ type: string; scale: EventScale } | null>(null);

  // Add role dropdown
  const [showAddRole, setShowAddRole] = useState(false);

  // Internal event (attendee-only)
  const [isInternal, setIsInternal] = useState(false);
  const [attendeeSlots, setAttendeeSlots] = useState(30);
  const [attendeeXP, setAttendeeXP] = useState(35); // default: Full Session

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successInfo, setSuccessInfo] = useState<{ eventId: string; eventName: string } | null>(null);

  // ── Luma fetch ──────────────────────────────────────────────────────────────
  async function handleLumaFetch() {
    if (!lumaUrl.trim()) return;
    setLumaLoading(true);
    setLumaError("");
    setLumaSuccess(false);

    try {
      const res = await fetch(`/api/luma?url=${encodeURIComponent(lumaUrl.trim())}`);
      const json = await res.json();

      if (!res.ok) { setLumaError(json.error || "Failed to fetch event details."); return; }

      if (json.name)        setEventName(json.name);
      if (json.description) setDescription(json.description);
      if (json.startDate) {
        setEventDate(isoToDateInput(json.startDate));
        setStartTime(isoToTimeInput(json.startDate));
      }
      if (json.endDate)  setEndTime(isoToTimeInput(json.endDate));
      if (json.location) setLocation(json.location);
      setLumaLink(lumaUrl.trim());
      setLumaSuccess(true);
    } catch {
      setLumaError("Could not reach the server. Try again.");
    } finally {
      setLumaLoading(false);
    }
  }


  function applyPreset(type: string, scale: EventScale) {
    setRoles(buildRolesFromPreset(type, scale));
    hasCustomRoles.current = false;
    setPresetPending(null);
    setShowAddRole(false);
  }

  function triggerPreset(type: string, scale: string) {
    if (!type || !scale) return;
    const s = scale as EventScale;
    if (hasCustomRoles.current) {
      setPresetPending({ type, scale: s });
    } else {
      applyPreset(type, s);
    }
  }

  function handleEventTypeChange(newType: string) {
    setEventType(newType);
    setIsInternal(INTERNAL_EVENT_TYPES.has(newType));
    triggerPreset(newType, eventScale);
  }

  function handleEventScaleChange(newScale: string) {
    setEventScale(newScale);
    triggerPreset(eventType, newScale);
  }

  function adjustSlots(id: string, delta: number) {
    hasCustomRoles.current = true;
    setPresetPending(null);
    setRoles((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, slots: Math.max(1, r.slots + delta) } : r
      )
    );
  }

  function removeRole(id: string) {
    hasCustomRoles.current = true;
    setPresetPending(null);
    setRoles((prev) => prev.filter((r) => r.id !== id));
  }

  function addRole(roleId: string) {
    const template = DEFAULT_ROLES.find((r) => r.id === roleId);
    if (!template) return;
    hasCustomRoles.current = true;
    setPresetPending(null);
    setRoles((prev) => [...prev, { ...template, slots: 3 }]);
    setShowAddRole(false);
  }

  // ── Banner file selection ────────────────────────────────────────────────────
  function handleBannerFile(file: File) {
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleBannerFile(file);
  }

  function handleBannerDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) return;
    handleBannerFile(file);
  }

  function removeBanner() {
    setBannerFile(null);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview("");
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const errors: Record<string, string> = {};
    if (!eventName.trim()) errors.name = "Event name is required.";
    if (!eventType) errors.eventType = "Event type is required.";
    if (!eventDate) errors.date = "Date is required.";
    if (!location.trim()) errors.location = "Location is required.";
    if (!isInternal && roles.length === 0) errors.roles = "At least one volunteer role is required.";
    if (isInternal && attendeeSlots < 1) errors.roles = "At least 1 attendee seat is required.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitError("");

    await submitNewEvent({
      router,
      chapterId: userData.chapterId,
      uid: firebaseUser.uid,
      eventName,
      eventType,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      lumaLink,
      bannerFile,
      isInternal,
      attendeeSlots,
      attendeeXP,
      roles,
      setSuccessInfo,
      setSubmitError,
      setSubmitting,
    });
  }

  if (successInfo !== null) {
    return <EventSuccessOverlay eventName={successInfo.eventName} />;
  }

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
        <div className="flex items-center gap-3">
          <Link
            href="/events"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <IconBack />
          </Link>
          <h1 className="font-heading text-2xl text-text-primary tracking-wide">Add Event</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent-primary/50 text-accent-highlight hover:bg-accent-primary/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-heading transition-colors"
          >
            {submitting ? "Creating…" : "Create Event"}
          </button>
          <Link href="/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt="Profile"
              width={36}
              height={36}
              className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors"
            />
          </Link>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 p-6"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 60% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)",
        }}
      >
        <div className="max-w-2xl mx-auto flex flex-col gap-5">
          <div className="flex flex-col gap-5">

          {/* ── A: Event Banner ─────────────────────────────────────────────── */}
          <FormSectionCard stripe="#06B6D4" animDelay={0}>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-heading text-base text-text-primary">Event Banner</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans font-medium uppercase tracking-wide">
                Optional
              </span>
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Upload a cover image for this event. Shown on the event card and details page.
            </p>

            {bannerPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-44 object-cover"
                />
                <button
                  onClick={removeBanner}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <IconX />
                </button>
                <div className="px-3 py-2 border-t border-border bg-[#1e1a2e]">
                  <p className="text-xs text-text-muted truncate">{bannerFile?.name}</p>
                </div>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center gap-3 h-36 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent-primary/50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleBannerDrop}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-sm text-text-secondary">Click or drag to upload</span>
                <span className="text-xs text-text-muted">PNG, JPG, WEBP · Max 5 MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </label>
            )}
          </FormSectionCard>

          {/* ── B: Import from Luma (collapsible) ───────────────────────────── */}
          <FormSectionCard stripe="#7C3AED" animDelay={60}>
            <button
              onClick={() => setLumaExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base text-text-primary">Import from Luma</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans font-medium uppercase tracking-wide">
                  Optional
                </span>
                {lumaSuccess && !lumaExpanded && (
                  <span className="flex items-center gap-1 text-[10px] text-green-400 font-sans animate-fade-in">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Imported
                  </span>
                )}
              </div>
              <IconChevron open={lumaExpanded} />
            </button>

            {lumaExpanded && (
              <div className="mt-4">
                <p className="text-xs text-text-secondary mb-4">
                  Paste a lu.ma event URL to auto-fill the form below.
                </p>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://lu.ma/… or https://luma.com/…"
                    value={lumaUrl}
                    onChange={(e) => {
                      setLumaUrl(e.target.value);
                      setLumaError("");
                      setLumaSuccess(false);
                    }}
                    disabled={lumaLoading}
                    className={`${INPUT_CLS} flex-1`}
                  />
                  <button
                    onClick={handleLumaFetch}
                    disabled={lumaLoading || !lumaUrl.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-heading transition-colors shrink-0"
                  >
                    {lumaLoading ? (
                      <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-white"
                            style={{ animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                    ) : (
                      "Fetch Details"
                    )}
                  </button>
                </div>

                {lumaError && <p className="mt-2 text-xs text-red-400">{lumaError}</p>}
                {lumaSuccess && (
                  <p className="mt-2 text-xs text-green-400 flex items-center gap-1.5 animate-fade-in">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Details imported successfully.
                  </p>
                )}
              </div>
            )}
          </FormSectionCard>

          {/* ── C: Event Details ────────────────────────────────────────────── */}
          <FormSectionCard animDelay={120}>
            <h2 className="font-heading text-base text-text-primary mb-5">Event Details</h2>

            {/* Name */}
            <div className="mb-4">
              <label className={LABEL_CLS}>Event Name *</label>
              <input
                type="text"
                placeholder="e.g. Code Camp 2025"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className={`${INPUT_CLS} ${fieldErrors.name ? "border-red-500/60 focus:ring-red-400/40" : ""}`}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className={LABEL_CLS}>Description</label>
              <textarea
                rows={4}
                placeholder="What is this event about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${INPUT_CLS} resize-none`}
              />
            </div>

            {/* Event Type */}
            <div className="mb-4">
              <label className={LABEL_CLS}>Event Type *</label>
              <select
                value={eventType}
                onChange={(e) => handleEventTypeChange(e.target.value)}
                className={`${INPUT_CLS} pr-10 ${fieldErrors.eventType ? "border-red-500/60 focus:ring-red-400/40" : ""}`}
                style={{ colorScheme: "dark" }}
              >
                <option value="" disabled>Select a type…</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {fieldErrors.eventType && <p className="mt-1 text-xs text-red-400">{fieldErrors.eventType}</p>}
            </div>

            {/* Internal event toggle — own row */}
            <button
              onClick={() => setIsInternal((v) => !v)}
              className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl border transition-colors mb-4 text-left ${
                isInternal
                  ? "border-accent-primary/60 bg-accent-primary/10"
                  : "border-border hover:bg-white/5"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-heading text-text-primary">Internal event</span>
                <span className="text-xs text-text-secondary">
                  No volunteer roles — attendees register with a single QR scan
                </span>
              </div>
              <div
                className="relative shrink-0 w-10 h-[22px] rounded-full transition-colors duration-200"
                style={{ backgroundColor: isInternal ? "#A855F7" : "#27272A" }}
              >
                <div
                  className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ transform: isInternal ? "translateX(22px)" : "translateX(3px)" }}
                />
              </div>
            </button>

            {/* Date + times */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className={LABEL_CLS}>Date *</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={`${INPUT_CLS} ${fieldErrors.date ? "border-red-500/60" : ""}`}
                  style={{ colorScheme: "dark" }}
                />
                {fieldErrors.date && <p className="mt-1 text-xs text-red-400">{fieldErrors.date}</p>}
              </div>
              <div>
                <label className={LABEL_CLS}>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={INPUT_CLS}
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={INPUT_CLS}
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className={LABEL_CLS}>Location *</label>
              <input
                type="text"
                placeholder="e.g. Cyber Hall B, Main Campus"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`${INPUT_CLS} ${fieldErrors.location ? "border-red-500/60" : ""}`}
              />
              {fieldErrors.location && <p className="mt-1 text-xs text-red-400">{fieldErrors.location}</p>}
            </div>

            {/* Luma link */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className={LABEL_CLS} style={{ marginBottom: 0 }}>Luma Event URL</label>
                {lumaSuccess && (
                  <span className="flex items-center gap-1 text-[10px] text-green-400 font-sans animate-fade-in">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Auto-filled from import
                  </span>
                )}
              </div>
              <input
                type="url"
                placeholder="https://lu.ma/your-event"
                value={lumaLink}
                onChange={(e) => setLumaLink(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </FormSectionCard>

          {/* ── D: Volunteer Roles / Attendee Config ────────────────────────── */}
          {isInternal ? (
          <FormSectionCard stripe="#A855F7" className="flex-1" animDelay={180}>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-heading text-base text-text-primary">Attendee Configuration</h2>
            </div>
            <p className="text-xs text-text-secondary mb-5">
              All registered volunteers will join as attendees. Coordinators confirm attendance by scanning each volunteer&apos;s QR code.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Attendee Seats *</label>
                <div className={`flex items-center ${INPUT_CLS} ${fieldErrors.roles ? "border-red-500/60" : ""}`}>
                  <button
                    onClick={() => setAttendeeSlots((v) => Math.max(1, v - 1))}
                    className="px-2 text-text-muted hover:text-text-primary transition-colors text-base leading-none select-none"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-sm text-text-primary tabular-nums select-none">
                    {attendeeSlots}
                  </span>
                  <button
                    onClick={() => setAttendeeSlots((v) => v + 1)}
                    className="px-2 text-text-muted hover:text-text-primary transition-colors text-base leading-none select-none"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>XP per Attendance</label>
                <select
                  value={attendeeXP}
                  onChange={(e) => setAttendeeXP(Number(e.target.value))}
                  className={`${INPUT_CLS} pr-10`}
                  style={{ colorScheme: "dark" }}
                >
                  {ATTENDEE_XP_TIERS.map((t) => (
                    <option key={t.xp} value={t.xp}>
                      {t.label} (+{t.xp} XP)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {fieldErrors.roles && (
              <p className="mt-2 text-xs text-red-400">{fieldErrors.roles}</p>
            )}

            <p className="mt-3 text-[11px] font-sans text-text-muted">
              XP is granted when a coordinator confirms a volunteer&apos;s attendance.
            </p>
          </FormSectionCard>
          ) : (
          <FormSectionCard stripe="#A855F7" className="flex-1" animDelay={180}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base text-text-primary">Volunteer Roles</h2>
              <span className="text-[11px] font-sans text-text-muted uppercase tracking-widest">
                {roles.length} role{roles.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Event Scale */}
            <div className="mb-4">
              <label className={LABEL_CLS}>Event Scale</label>
              <select
                value={eventScale}
                onChange={(e) => handleEventScaleChange(e.target.value)}
                className={`${INPUT_CLS} pr-10`}
                style={{ colorScheme: "dark" }}
              >
                <option value="" disabled>Select event scale…</option>
                {EVENT_SCALES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] font-sans text-text-muted">
                Combined with the event type to pre-fill recommended volunteer counts.
              </p>
            </div>

            {/* Preset pending warning */}
            {presetPending && (
              <div
                className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 mb-4 animate-fade-up"
                style={{ backgroundColor: "#2a1f3d", borderColor: "#A855F760" }}
              >
                <span className="text-xs text-text-secondary">
                  Applying this preset will reset your custom roles.
                </span>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => applyPreset(presetPending.type, presetPending.scale)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-accent-highlight hover:bg-accent-primary text-white transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setPresetPending(null)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Keep
                  </button>
                </div>
              </div>
            )}

            {roles.length === 0 ? (
              /* ── Guided empty state ─────────────────────────────────────────── */
              <div
                className="flex flex-col items-center gap-3 py-7 px-4 rounded-xl border-2 border-dashed text-center"
                style={{ borderColor: "#27272A" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#A855F718" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>

                {!eventType || !eventScale ? (
                  <>
                    <div>
                      <p className="text-sm font-heading text-text-primary mb-1">
                        Roles will be suggested here
                      </p>
                      <p className="text-xs text-text-secondary">
                        Select an event type and scale above to auto-fill recommended volunteer counts.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-sans transition-colors ${
                          eventType
                            ? "border-green-500/40 text-green-400 bg-green-500/10"
                            : "border-border text-text-muted"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${eventType ? "bg-green-400" : "bg-text-muted"}`} />
                        Event Type
                      </span>
                      <span
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-sans transition-colors ${
                          eventScale
                            ? "border-green-500/40 text-green-400 bg-green-500/10"
                            : "border-border text-text-muted"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${eventScale ? "bg-green-400" : "bg-text-muted"}`} />
                        Event Scale
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-sm font-heading text-text-primary mb-1">No roles yet</p>
                    <p className="text-xs text-text-secondary mb-3">
                      Add at least one volunteer role for this event.
                    </p>
                    {showAddRole ? (
                      <select
                        autoFocus
                        defaultValue=""
                        onChange={(e) => { if (e.target.value) addRole(e.target.value); }}
                        onBlur={() => setShowAddRole(false)}
                        className={`${INPUT_CLS} pr-10`}
                        style={{ colorScheme: "dark" }}
                      >
                        <option value="" disabled>Select a role to add…</option>
                        {DEFAULT_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.roleName} (+{r.xpReward} XP)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setShowAddRole(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-accent-primary/50 text-accent-highlight hover:bg-accent-primary/10 text-sm font-heading transition-colors mx-auto"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Role
                      </button>
                    )}
                  </div>
                )}

                {fieldErrors.roles && (
                  <p className="text-xs text-red-400">{fieldErrors.roles}</p>
                )}
              </div>
            ) : (
              /* ── Role table ─────────────────────────────────────────────────── */
              <>
                <div className="grid grid-cols-[1fr_auto_auto_32px] gap-3 mb-2 px-1">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Role</span>
                  <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">XP</span>
                  <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted text-center">Slots</span>
                  <span />
                </div>

                <div className="flex flex-col gap-2">
                  {roles.map((role, i) => (
                    <div
                      key={role.id}
                      className="grid grid-cols-[1fr_auto_auto_32px] gap-3 items-center rounded-xl border border-border px-3 py-2.5 animate-fade-up"
                      style={{ backgroundColor: "#252038", animationDelay: `${i * 50}ms` }}
                    >
                      <span className="text-sm text-text-primary font-sans truncate">{role.roleName}</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-md border shrink-0"
                        style={{ color: "#A855F7", borderColor: "#A855F760", backgroundColor: "#A855F718" }}
                      >
                        +{role.xpReward} XP
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => adjustSlots(role.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-white/8 transition-colors text-base leading-none select-none">−</button>
                        <span className="w-7 text-center text-sm text-text-primary tabular-nums select-none">{role.slots}</span>
                        <button onClick={() => adjustSlots(role.id, +1)} className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-white/8 transition-colors text-base leading-none select-none">+</button>
                      </div>
                      <button onClick={() => removeRole(role.id)} className="flex items-center justify-center w-7 h-7 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <IconX />
                      </button>
                    </div>
                  ))}
                </div>

                {fieldErrors.roles && (
                  <p className="mt-2 text-xs text-red-400">{fieldErrors.roles}</p>
                )}

                {/* Add Role */}
                {(() => {
                  const available = DEFAULT_ROLES.filter(
                    (r) => !roles.some((existing) => existing.id === r.id)
                  );
                  const allAdded = available.length === 0;
                  return (
                    <div className="mt-3">
                      {showAddRole && !allAdded ? (
                        <select
                          autoFocus
                          defaultValue=""
                          onChange={(e) => { if (e.target.value) addRole(e.target.value); }}
                          onBlur={() => setShowAddRole(false)}
                          className={`${INPUT_CLS} pr-10`}
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
                          onClick={() => setShowAddRole(true)}
                          disabled={allAdded}
                          title={allAdded ? "All roles added" : undefined}
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

                <p className="mt-3 text-[11px] font-sans text-text-muted">
                  Adjust slot counts as needed. XP values are fixed by the DevQuest system.
                </p>
              </>
            )}
          </FormSectionCard>
          )}

          </div>

          {/* ── Submit ────────────────────────────────────────────────────────── */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 animate-fade-up">
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-accent-highlight hover:bg-accent-primary disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-white font-heading font-medium text-base transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="flex gap-1">
                {NEW_EVENT_WAVE_COLORS.map((color, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
                ))}
              </span>
            ) : "Create Event"}
          </button>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
