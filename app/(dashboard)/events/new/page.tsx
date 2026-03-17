"use client";

import { useState, useEffect } from "react";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const TEAM_COLORS = ["#F5C518", "#F97316", "#22C55E", "#9333EA", "#06B6D4"];

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

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
  children,
}: {
  stripe?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border border-border overflow-hidden"
      style={{ backgroundColor: "#1e1a2e" }}
    >
      {/* Colored top stripe */}
      <div className="h-[3px] w-full" style={{ background: stripe }} />
      <div className="p-5">{children}</div>
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

  // ── Role slot updates (coordinator only controls slots) ───────────────────
  function updateSlots(id: string, value: string) {
    setRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, slots: Number(value) || 1 } : r))
    );
  }

  function adjustSlots(id: string, delta: number) {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, slots: Math.max(1, r.slots + delta) } : r
      )
    );
  }

  function removeRole(id: string) {
    setRoles((prev) => prev.filter((r) => r.id !== id));
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
    if (!eventName.trim())  errors.name     = "Event name is required.";
    if (!eventDate)         errors.date     = "Date is required.";
    if (!location.trim())   errors.location = "Location is required.";
    if (roles.length === 0) errors.roles    = "At least one volunteer role is required.";

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
        description: description.trim(),
        date:        startTs,
        ...(endTs     ? { endDate: endTs }     : {}),
        location:    location.trim(),
        ...(lumaLink  ? { lumaUrl: lumaLink }  : {}),
        ...(bannerUrl ? { bannerUrl }          : {}),
        chapterId:   userData!.chapterId,
        createdBy:   firebaseUser!.uid,
        roles: roles.map(({ roleName, xpReward, slots }) => ({
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
  if (!authChecked || !userData) return null;

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
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
          <Link
            href="/notifications"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <IconBell />
          </Link>
          <Link href="/dashboard">
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
                        className="w-1.5 h-1.5 rounded-full bg-white animate-[wave-dot_0.6s_ease-in-out_infinite]"
                        style={{ animationDelay: `${i * 0.15}s` }}
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
          <SectionCard stripe="#22C55E">
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

          {/* ── D: Volunteer Roles ──────────────────────────────────────────── */}
          <SectionCard stripe="#A855F7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base text-text-primary">Volunteer Roles</h2>
              <span className="text-[11px] font-sans text-text-muted uppercase tracking-widest">
                {roles.length} role{roles.length !== 1 ? "s" : ""}
              </span>
            </div>

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

            <p className="mt-3 text-[11px] font-sans text-text-muted">
              Adjust slot counts as needed. XP values are fixed by the DevQuest system.
            </p>
          </SectionCard>

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
            {TEAM_COLORS.map((color, i) => (
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
