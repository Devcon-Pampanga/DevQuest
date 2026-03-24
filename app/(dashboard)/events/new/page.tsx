"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";
import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const WAVE_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvatarOptions {
  backgroundColor: string;
  backgroundType: "solid" | "gradientLinear";
  eyes: string;
  mouth: string;
}

interface UserData {
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  avatarOptions?: AvatarOptions;
}

interface RoleEntry {
  id: string;
  roleName: string;
  xpReward: number;
  slots: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR: AvatarOptions = {
  backgroundColor: "5e35b1",
  backgroundType: "solid",
  eyes: "round",
  mouth: "smile01",
};

function buildAvatarUrl(seed: string, opts: AvatarOptions): string {
  const params: Record<string, string> = {
    seed,
    backgroundColor: opts.backgroundColor,
    backgroundType: opts.backgroundType,
    eyes: opts.eyes,
    mouth: opts.mouth,
  };
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?${new URLSearchParams(params).toString()}`;
}

const DEFAULT_ROLES: RoleEntry[] = [
  { id: "facilitator",   roleName: "Facilitator",   xpReward: 60, slots: 10 },
  { id: "host",          roleName: "Host",           xpReward: 50, slots: 5  },
  { id: "tech",          roleName: "Tech",           xpReward: 40, slots: 5  },
  { id: "registration",  roleName: "Registration",   xpReward: 30, slots: 10 },
  { id: "usher",         roleName: "Usher",          xpReward: 30, slots: 10 },
  { id: "documentation", roleName: "Documentation",  xpReward: 30, slots: 5  },
];

function isoToDateInput(iso: string): string {
  if (!iso) return "";
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ""; }
}

function isoToTimeInput(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch { return ""; }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Shared style constants (matching onboarding page) ────────────────────────

// Used inside cards — bg-surface matches the onboarding input background
const INPUT_CLS =
  "w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-highlight transition-shadow";

const LABEL_CLS =
  "block text-[11px] font-sans uppercase tracking-widest text-text-secondary mb-2";

// Shared card wrapper — matches onboarding dialog team cards
function SectionCard({
  stripe = "linear-gradient(90deg, #7C3AED, #A855F7)",
  className = "",
  children,
}: {
  stripe?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border overflow-hidden ${className}`}
      style={{ backgroundColor: "#1e1a2e" }}
    >
      {/* Colored top stripe */}
      <div className="h-[3px] w-full" style={{ background: stripe }} />
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Event types that default to attendee-only (no volunteer role selection)
const INTERNAL_EVENT_TYPES = new Set(["Lead Learner Workshop", "Volunteer Orientation"]);

// XP tiers for internal / attendee-only events
const ATTENDEE_XP_TIERS = [
  { label: "Brief Session",  description: "1–2 hour drop-in or orientation", xp: 20 },
  { label: "Full Session",   description: "Half-day to full-day workshop",   xp: 35 },
  { label: "Intensive",      description: "Multi-day or demanding program",   xp: 60 },
] as const;

const EVENT_TYPES = [
  // Quest-triggering types — auto-complete qr_scan milestones on attendance
  "Code Camp",
  "Lead Learner Workshop",
  "Volunteer Orientation",
  "School Event",
  "External Workshop",
  "Tech Summit",
  // General types — no automatic quest triggers
  "Volunteer Social Meetup",
  "Workshop",
  "Seminar",
  "Convention",
  "Hackathon",
  "Networking",
  "Training",
  "Community Meetup",
  "Other",
];

// ─── Scale + Loadout System ───────────────────────────────────────────────────

type EventScale = "small" | "medium" | "large" | "conference";

const EVENT_SCALES: { value: EventScale; label: string }[] = [
  { value: "small",      label: "Small (< 20 Attendees)" },
  { value: "medium",     label: "Medium (20–50 Attendees)" },
  { value: "large",      label: "Large (50–150 Attendees)" },
  { value: "conference", label: "Conference (150+ Attendees)" },
];

const WORKSHOP_TYPES = new Set([
  "Workshop", "Seminar", "Training", "Lead Learner Workshop",
  "External Workshop", "Code Camp",
]);
const CONVENTION_TYPES = new Set([
  "Convention", "Hackathon", "Tech Summit", "School Event",
]);
const SOCIAL_TYPES = new Set([
  "Volunteer Social Meetup", "Networking", "Volunteer Orientation", "Community Meetup",
]);

// slots: 0 means role is excluded for this combination
const SCALE_LOADOUTS: Record<string, Record<EventScale, Record<string, number>>> = {
  workshop: {
    small:      { Facilitator: 3, Host: 0,  Tech: 2,  Registration: 2,  Usher: 0,  Documentation: 1 },
    medium:     { Facilitator: 6, Host: 1,  Tech: 3,  Registration: 4,  Usher: 0,  Documentation: 2 },
    large:      { Facilitator: 12, Host: 2, Tech: 6,  Registration: 8,  Usher: 5,  Documentation: 3 },
    conference: { Facilitator: 20, Host: 3, Tech: 10, Registration: 12, Usher: 10, Documentation: 5 },
  },
  convention: {
    small:      { Facilitator: 4,  Host: 1, Tech: 3,  Registration: 4,  Usher: 0,  Documentation: 2 },
    medium:     { Facilitator: 8,  Host: 2, Tech: 6,  Registration: 8,  Usher: 5,  Documentation: 3 },
    large:      { Facilitator: 15, Host: 3, Tech: 10, Registration: 15, Usher: 10, Documentation: 5 },
    conference: { Facilitator: 25, Host: 5, Tech: 20, Registration: 25, Usher: 20, Documentation: 8 },
  },
  social: {
    small:      { Facilitator: 0, Host: 0, Tech: 0, Registration: 3,  Usher: 3,  Documentation: 1 },
    medium:     { Facilitator: 0, Host: 1, Tech: 0, Registration: 5,  Usher: 5,  Documentation: 2 },
    large:      { Facilitator: 0, Host: 2, Tech: 2, Registration: 10, Usher: 8,  Documentation: 3 },
    conference: { Facilitator: 3, Host: 3, Tech: 4, Registration: 15, Usher: 12, Documentation: 5 },
  },
  other: {
    small:      { Facilitator: 3,  Host: 0, Tech: 0, Registration: 3,  Usher: 0,  Documentation: 1 },
    medium:     { Facilitator: 5,  Host: 1, Tech: 2, Registration: 5,  Usher: 0,  Documentation: 2 },
    large:      { Facilitator: 10, Host: 2, Tech: 4, Registration: 10, Usher: 5,  Documentation: 3 },
    conference: { Facilitator: 15, Host: 3, Tech: 8, Registration: 15, Usher: 10, Documentation: 5 },
  },
};

function getEventCategory(type: string): "workshop" | "convention" | "social" | "other" {
  if (WORKSHOP_TYPES.has(type)) return "workshop";
  if (CONVENTION_TYPES.has(type)) return "convention";
  if (SOCIAL_TYPES.has(type)) return "social";
  return "other";
}

function buildRolesFromPreset(type: string, scale: EventScale): RoleEntry[] {
  const cat = getEventCategory(type);
  const loadout = SCALE_LOADOUTS[cat][scale];
  return DEFAULT_ROLES
    .filter((r) => (loadout[r.roleName] ?? 0) > 0)
    .map((r) => ({ ...r, slots: loadout[r.roleName] }));
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NewEventSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5 pb-10">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <SkeletonLine className="w-24" />
          <SkeletonBlock className="h-11 rounded-xl w-full" />
        </div>
      ))}
      <SkeletonBlock className="h-32 rounded-2xl w-full" />
      <SkeletonBlock className="h-12 rounded-xl w-full" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewEventPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Luma import
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
  const [roles, setRoles] = useState<RoleEntry[]>(DEFAULT_ROLES);

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

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/"); return; }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data()?.onboardingComplete !== true) {
        router.replace("/onboarding");
        return;
      }

      const data = snap.data() as UserData;
      if (data.role !== "coordinator") { router.replace("/events"); return; }

      setFirebaseUser(user);
      setUserData(data);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

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
  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const url = URL.createObjectURL(file);
    setBannerPreview(url);
  }

  function removeBanner() {
    setBannerFile(null);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview("");
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const errors: Record<string, string> = {};
    if (!eventName.trim())  errors.name      = "Event name is required.";
    if (!eventType)         errors.eventType = "Event type is required.";
    if (!eventDate)         errors.date      = "Date is required.";
    if (!location.trim())   errors.location  = "Location is required.";
    if (!isInternal && roles.length === 0) errors.roles = "At least one volunteer role is required.";
    if (isInternal && attendeeSlots < 1)   errors.roles = "At least 1 attendee seat is required.";

    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setSubmitError("");
    setSubmitting(true);

    try {
      const startTs = Timestamp.fromDate(new Date(`${eventDate}T${startTime || "00:00"}`));
      const endTs   = endTime ? Timestamp.fromDate(new Date(`${eventDate}T${endTime}`)) : null;

      const eventRef = doc(collection(db, "events"));

      // Upload banner if provided
      let bannerUrl: string | undefined;
      if (bannerFile) {
        const bannerRef = ref(storage, `event-banners/${eventRef.id}/banner`);
        await uploadBytes(bannerRef, bannerFile);
        bannerUrl = await getDownloadURL(bannerRef);
      }

      await setDoc(eventRef, {
        eventId:     eventRef.id,
        name:        eventName.trim(),
        eventType,
        description: description.trim(),
        date:        startTs,
        ...(endTs     ? { endDate: endTs }     : {}),
        location:    location.trim(),
        ...(lumaLink  ? { lumaUrl: lumaLink }  : {}),
        ...(bannerUrl ? { bannerUrl }          : {}),
        chapterId:   userData!.chapterId,
        createdBy:   firebaseUser!.uid,
        ...(isInternal ? { isInternal: true } : {}),
        roles: isInternal
          ? [{ roleName: "Attendee", xpReward: Number(attendeeXP) || 30, slots: Number(attendeeSlots) || 1 }]
          : roles.map(({ roleName, xpReward, slots }) => ({
              roleName,
              xpReward,
              slots: Number(slots) || 1,
            })),
        createdAt: serverTimestamp(),
      });

      router.push(`/events/${eventRef.id}`);
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to create the event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render guard ─────────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <PageShell
        title="Add Event"
        loading={true}
        skeleton={<NewEventSkeleton />}
      >
        {null}
      </PageShell>
    );
  }

  if (!userData) return null;

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
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5">
          <div className="flex flex-col gap-5">

          {/* ── A: Import from Luma ─────────────────────────────────────────── */}
          <SectionCard stripe="#7C3AED">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-heading text-base text-text-primary">Import from Luma</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans font-medium uppercase tracking-wide">
                Optional
              </span>
            </div>
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
              <p className="mt-2 text-xs text-green-400 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Details imported successfully.
              </p>
            )}
          </SectionCard>

          {/* ── B: Event Details ────────────────────────────────────────────── */}
          <SectionCard>
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

            {/* Event Type + Internal toggle (same row) */}
            <div className="flex items-end gap-3 mb-4">
              {/* Event Type */}
              <div className="flex-1 min-w-0">
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

              {/* Internal toggle */}
              <button
                onClick={() => setIsInternal((v) => !v)}
                className="shrink-0 flex flex-col items-center gap-1.5 pb-[11px]"
              >
                <span className={LABEL_CLS} style={{ marginBottom: 0 }}>Internal</span>
                <div
                  className="relative w-10 h-[22px] rounded-full transition-colors duration-200"
                  style={{ backgroundColor: isInternal ? "#A855F7" : "#27272A" }}
                >
                  <div
                    className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                    style={{ transform: isInternal ? "translateX(22px)" : "translateX(3px)" }}
                  />
                </div>
              </button>
            </div>

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
              <label className={LABEL_CLS}>Luma Link</label>
              <input
                type="url"
                placeholder="https://lu.ma/your-event"
                value={lumaLink}
                onChange={(e) => setLumaLink(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </SectionCard>

          {/* ── C: Event Banner ─────────────────────────────────────────────── */}
          <SectionCard stripe="#06B6D4">
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
              <label className="flex flex-col items-center justify-center gap-3 h-36 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent-primary/50 transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-sm text-text-secondary">Click to upload an image</span>
                <span className="text-xs text-text-muted">PNG, JPG, WEBP · Max 5 MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </label>
            )}
          </SectionCard>

          {/* ── D: Volunteer Roles / Attendee Config ────────────────────────── */}
          {isInternal ? (
          <SectionCard stripe="#A855F7" className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-heading text-base text-text-primary">Attendee Configuration</h2>
            </div>
            <p className="text-xs text-text-secondary mb-5">
              All registered volunteers will join as attendees. Coordinators confirm attendance by scanning each volunteer&apos;s QR code.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Attendee Seats *</label>
                <input
                  type="number"
                  min={1}
                  value={attendeeSlots}
                  onChange={(e) => setAttendeeSlots(Math.max(1, Number(e.target.value)))}
                  className={`${INPUT_CLS} ${fieldErrors.roles ? "border-red-500/60" : ""}`}
                  style={{ colorScheme: "dark" }}
                />
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
          </SectionCard>
          ) : (
          <SectionCard stripe="#A855F7" className="flex-1">
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
                className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 mb-4"
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

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto_32px] gap-3 mb-2 px-1">
              <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">Role</span>
              <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">XP</span>
              <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted text-center">Slots</span>
              <span />
            </div>

            <div className="flex flex-col gap-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="grid grid-cols-[1fr_auto_auto_32px] gap-3 items-center rounded-xl border border-border px-3 py-2.5"
                  style={{ backgroundColor: "#252038" }}
                >
                  {/* Role name — read-only */}
                  <span className="text-sm text-text-primary font-sans truncate">
                    {role.roleName}
                  </span>

                  {/* XP — read-only badge */}
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-md border shrink-0"
                    style={{
                      color: "#A855F7",
                      borderColor: "#A855F760",
                      backgroundColor: "#A855F718",
                    }}
                  >
                    +{role.xpReward} XP
                  </span>

                  {/* Slots — minimal stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => adjustSlots(role.id, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-white/8 transition-colors text-base leading-none select-none"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm text-text-primary tabular-nums select-none">
                      {role.slots}
                    </span>
                    <button
                      onClick={() => adjustSlots(role.id, +1)}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-white/8 transition-colors text-base leading-none select-none"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeRole(role.id)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
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
          </SectionCard>
          )}

          </div>

          {/* ── Submit ────────────────────────────────────────────────────────── */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-accent-highlight hover:bg-accent-primary disabled:opacity-60 disabled:cursor-not-allowed rounded-lg text-white font-heading font-medium text-base transition-colors"
          >
            {submitting ? "Creating Event..." : "Create Event"}
          </button>

          {/* Team color wave dots */}
          <div className="flex justify-center gap-2 mt-2">
            {WAVE_COLORS.map((color, i) => (
              <div
                key={color}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: color,
                  ...(submitting && {
                    animation: "wave-dot 0.6s ease-in-out infinite",
                    animationDelay: `${i * 0.1}s`,
                  }),
                }}
              />
            ))}
          </div>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
