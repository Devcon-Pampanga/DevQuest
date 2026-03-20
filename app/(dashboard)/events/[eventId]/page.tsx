"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  increment,
  addDoc,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";


// ─── Types ────────────────────────────────────────────────────────────────────

interface AvatarOptions {
  backgroundColor: string;
  backgroundType: "solid" | "gradientLinear";
  eyes: string;
  mouth: string;
}

interface UserData {
  uid: string;
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  xp: number;
  avatarOptions?: AvatarOptions;
}

interface EventRole {
  roleName: string;
  slots: number;
  xpReward: number;
}

interface EventDoc {
  eventId: string;
  name: string;
  description: string;
  date: Timestamp;
  endDate?: Timestamp;
  location: string;
  chapterId: string;
  roles: EventRole[];
  lumaUrl?: string;
  bannerUrl?: string;
}

interface Registration {
  userId: string;
  role: string;
  roleXP: number;
  qrData: string;
  attended: boolean;
  reflectionSubmitted: boolean;
  reflectionDeadline?: Timestamp;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
  username?: string; // populated client-side for coordinator view
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR: AvatarOptions = {
  backgroundColor: "5e35b1",
  backgroundType: "solid",
  eyes: "round",
  mouth: "smile01",
};

function buildAvatarUrl(seed: string, opts?: AvatarOptions): string {
  const o = opts ?? DEFAULT_AVATAR;
  const params: Record<string, string> = {
    seed,
    backgroundColor: o.backgroundColor,
    backgroundType: o.backgroundType,
    eyes: o.eyes,
    mouth: o.mouth,
  };
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?${new URLSearchParams(params).toString()}`;
}

function formatDate(ts: Timestamp): string {
  return ts.toDate().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(ts: Timestamp): string {
  return ts.toDate().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function hoursUntil(ts: Timestamp): number {
  return Math.max(0, Math.floor((ts.toDate().getTime() - Date.now()) / 3600000));
}

function isUpcoming(ts: Timestamp): boolean {
  return ts.toDate() > new Date();
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

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconQr() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 21h.01M21 14h.01M21 21h.01" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ─── Date/time helpers for edit modal ─────────────────────────────────────────

function tsToDateInput(ts: Timestamp): string {
  return ts.toDate().toISOString().slice(0, 10);
}

function tsToTimeInput(ts: Timestamp): string {
  const d = ts.toDate();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ─── Edit Event Modal ─────────────────────────────────────────────────────────

const EDIT_INPUT =
  "w-full bg-[#0a0a0f] border border-[#27272A] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#52525B] focus:outline-none focus:ring-2 focus:ring-[#A855F7] transition-shadow";

const EDIT_LABEL =
  "block text-[11px] font-sans uppercase tracking-widest text-[#A1A1AA] mb-2";

interface EditFields {
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  lumaUrl: string;
}

function EditEventModal({
  event,
  onSave,
  onClose,
  saving,
}: {
  event: EventDoc;
  onSave: (fields: EditFields, bannerFile: File | null) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [fields, setFields] = useState<EditFields>({
    name: event.name,
    description: event.description ?? "",
    date: tsToDateInput(event.date),
    startTime: tsToTimeInput(event.date),
    endTime: event.endDate ? tsToTimeInput(event.endDate) : "",
    location: event.location,
    lumaUrl: event.lumaUrl ?? "",
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  function set(key: keyof EditFields, value: string) {
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
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-[#27272A] overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#1e1a2e" }}
      >
        {/* Stripe */}
        <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #7C3AED, #A855F7)" }} />

        <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-minimal">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-xl text-white">Edit Event</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#52525B] hover:text-white hover:bg-white/5 transition-colors">
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
              <div className="rounded-xl overflow-hidden border border-[#27272A] bg-[#0a0a0f]">
                {(bannerPreview || event.bannerUrl) && (
                  <img
                    src={bannerPreview ?? event.bannerUrl}
                    alt="Banner preview"
                    className="w-full h-28 object-cover opacity-80"
                  />
                )}
                <label className="flex items-center justify-center gap-2 py-3 cursor-pointer hover:bg-white/5 transition-colors text-sm text-[#A1A1AA] hover:text-white">
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
              className="flex-1 py-3 rounded-xl border border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-[#A1A1AA] text-sm font-heading transition-colors"
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

// ─── Role Selection Modal ─────────────────────────────────────────────────────

function RoleModal({
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

  const available = roles.filter(
    (r) => (slotCounts[r.roleName] ?? 0) < r.slots
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-elevated border border-border rounded-2xl p-6 shadow-2xl">
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

// ─── QR Scanner Modal ─────────────────────────────────────────────────────────

function QrScannerModal({
  onScan,
  onClose,
}: {
  onScan: (data: string) => void;
  onClose: () => void;
}) {
  const [scannerReady, setScannerReady] = useState(false);
  const [scanError, setScanError] = useState("");

  useEffect(() => {
    let scanner: { clear: () => void } | null = null;

    (async () => {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        const s = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        s.render(
          (decodedText: string) => {
            onScan(decodedText);
            s.clear().catch(() => {});
          },
          () => {}
        );
        scanner = s;
        setScannerReady(true);
      } catch {
        setScanError("Camera not available or permission denied.");
      }
    })();

    return () => {
      if (scanner) {
        try { scanner.clear(); } catch { /* ignore */ }
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-elevated border border-border rounded-2xl p-6 shadow-2xl">
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
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-white animate-[wave-dot_0.6s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

type CoordTab = "details" | "volunteers";

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  // Auth
  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Event data
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [myReg, setMyReg] = useState<Registration | null>(null);
  const [allRegs, setAllRegs] = useState<Registration[]>([]);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // UI state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [coordTab, setCoordTab] = useState<CoordTab>("details");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Edit / Delete state
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setFirebaseUser(user);
      setUserData({ ...data, uid: user.uid });
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  // ── Fetch event data ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userData) return;
    setLoading(true);

    try {
      const eventSnap = await getDoc(doc(db, "events", eventId));
      if (!eventSnap.exists()) { router.replace("/events"); return; }
      const eventData = { eventId: eventSnap.id, ...eventSnap.data() } as EventDoc;
      setEvent(eventData);

      // Own registration
      const myRegSnap = await getDoc(doc(db, "events", eventId, "registrations", userData.uid));
      setMyReg(myRegSnap.exists() ? (myRegSnap.data() as Registration) : null);

      // All registrations (coordinator) + slot counts (everyone)
      const allRegsSnap = await getDocs(collection(db, "events", eventId, "registrations"));
      const regs: Registration[] = [];
      const counts: Record<string, number> = {};

      for (const d of allRegsSnap.docs) {
        const reg = d.data() as Registration;
        regs.push(reg);
        counts[reg.role] = (counts[reg.role] ?? 0) + 1;
      }

      // Populate usernames for coordinator view
      if (userData.role === "coordinator") {
        const withNames: Registration[] = await Promise.all(
          regs.map(async (reg) => {
            try {
              const uSnap = await getDoc(doc(db, "users", reg.userId));
              return { ...reg, username: uSnap.data()?.username ?? reg.userId };
            } catch {
              return { ...reg, username: reg.userId };
            }
          })
        );
        setAllRegs(withNames);
      }

      setSlotCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userData, eventId, router]);

  useEffect(() => {
    if (authChecked) fetchData();
  }, [authChecked, fetchData]);

  // ── Join event ───────────────────────────────────────────────────────────────
  async function handleJoin(role: EventRole) {
    if (!firebaseUser || !event) return;
    setJoiningLoading(true);
    try {
      const qrData = `devquest://attendance?eventId=${eventId}&userId=${firebaseUser.uid}&role=${encodeURIComponent(role.roleName)}`;
      await setDoc(doc(db, "events", eventId, "registrations", firebaseUser.uid), {
        userId: firebaseUser.uid,
        role: role.roleName,
        roleXP: role.xpReward,
        qrData,
        attended: false,
        reflectionSubmitted: false,
      });
      setShowRoleModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningLoading(false);
    }
  }

  // ── Confirm attendance (coordinator) ─────────────────────────────────────────
  async function confirmAttendance(reg: Registration) {
    if (!firebaseUser) return;
    setConfirmingId(reg.userId);
    try {
      const deadline = Timestamp.fromDate(new Date(Date.now() + 72 * 60 * 60 * 1000));
      await updateDoc(doc(db, "events", eventId, "registrations", reg.userId), {
        attended: true,
        confirmedAt: serverTimestamp(),
        confirmedBy: firebaseUser.uid,
        reflectionDeadline: deadline,
      });

      // Grant XP + log
      await updateDoc(doc(db, "users", reg.userId), {
        xp: increment(reg.roleXP),
      });
      await addDoc(collection(db, "users", reg.userId, "xpLog"), {
        source: "event_attendance",
        sourceId: eventId,
        description: `Attended ${event?.name ?? "event"} as ${reg.role}`,
        xp: reg.roleXP,
        createdAt: serverTimestamp(),
      });

      // Notification
      await addDoc(collection(db, "users", reg.userId, "notifications"), {
        type: "attendance_confirmed",
        message: `Your attendance at ${event?.name ?? "the event"} has been confirmed. +${reg.roleXP} XP!`,
        read: false,
        relatedId: eventId,
        createdAt: serverTimestamp(),
      });

      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmingId(null);
    }
  }

  // ── Confirm all ──────────────────────────────────────────────────────────────
  async function confirmAll() {
    const unconfirmed = allRegs.filter((r) => !r.attended);
    if (unconfirmed.length === 0) return;
    setConfirmingAll(true);
    for (const reg of unconfirmed) {
      await confirmAttendance(reg);
    }
    setConfirmingAll(false);
  }

  // ── QR scan handler ──────────────────────────────────────────────────────────
  const handleQrScan = useCallback(async (data: string) => {
    setShowQrScanner(false);
    try {
      const url = new URL(data.replace("devquest://", "https://devquest.app/"));
      const scannedEventId = url.searchParams.get("eventId");
      const scannedUserId = url.searchParams.get("userId");

      if (scannedEventId !== eventId || !scannedUserId) {
        setScanFeedback({ ok: false, msg: "Invalid QR code — wrong event." });
        return;
      }

      const regSnap = await getDoc(doc(db, "events", eventId, "registrations", scannedUserId));
      if (!regSnap.exists()) {
        setScanFeedback({ ok: false, msg: "No registration found for this volunteer." });
        return;
      }

      const reg = regSnap.data() as Registration;
      if (reg.attended) {
        setScanFeedback({ ok: false, msg: "Already marked as attended." });
        return;
      }

      await confirmAttendance(reg);
      setScanFeedback({ ok: true, msg: `Attendance confirmed for ${reg.userId}.` });
    } catch {
      setScanFeedback({ ok: false, msg: "Failed to parse QR code." });
    }
    setTimeout(() => setScanFeedback(null), 4000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // ── Edit event ───────────────────────────────────────────────────────────────
  async function handleSaveEdit(fields: EditFields, bannerFile: File | null) {
    setSaving(true);
    try {
      const startTs = Timestamp.fromDate(new Date(`${fields.date}T${fields.startTime || "00:00"}`));
      const endTs = fields.endTime
        ? Timestamp.fromDate(new Date(`${fields.date}T${fields.endTime}`))
        : null;

      const updates: Record<string, unknown> = {
        name: fields.name.trim(),
        description: fields.description.trim(),
        date: startTs,
        location: fields.location.trim(),
      };
      if (endTs) updates.endDate = endTs;
      if (fields.lumaUrl.trim()) updates.lumaUrl = fields.lumaUrl.trim();

      if (bannerFile) {
        const bannerRef = ref(storage, `event-banners/${eventId}/banner`);
        try { await deleteObject(bannerRef); } catch { /* no existing banner */ }
        await uploadBytes(bannerRef, bannerFile);
        updates.bannerUrl = await getDownloadURL(bannerRef);
      }

      await updateDoc(doc(db, "events", eventId), updates);
      await fetchData();
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete event ─────────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true);
    try {
      if (event?.bannerUrl) {
        try {
          await deleteObject(ref(storage, `event-banners/${eventId}/banner`));
        } catch { /* banner may not exist */ }
      }
      await deleteDoc(doc(db, "events", eventId));
      router.replace("/events");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  // ── Export CSV ───────────────────────────────────────────────────────────────
  function exportCsv() {
    const header = "Username,Role,XP,Attended,Reflection Submitted";
    const rows = allRegs.map((r) =>
      [r.username ?? r.userId, r.role, r.roleXP, r.attended, r.reflectionSubmitted].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.name ?? "event"}-volunteers.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (!authChecked || !userData) return null;

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions);
  const isCoord = userData.role === "coordinator";

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link href="/events" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
              <IconBack />
            </Link>
            <div className="h-6 w-40 rounded-lg bg-surface animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-white" style={{ animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const upcoming = isUpcoming(event.date);
  const totalSlots = event.roles.reduce((s, r) => s + r.slots, 0);
  const totalFilled = Object.values(slotCounts).reduce((s, c) => s + c, 0);

  const confirmed = allRegs.filter((r) => r.attended).length;
  const reflections = allRegs.filter((r) => r.reflectionSubmitted).length;

  // Volunteer join state
  const joined = !!myReg;
  const attended = myReg?.attended ?? false;
  const reflectionSubmitted = myReg?.reflectionSubmitted ?? false;
  const reflectionDeadline = myReg?.reflectionDeadline;
  const reflectionOpen =
    attended && !reflectionSubmitted && reflectionDeadline && reflectionDeadline.toDate() > new Date();
  const hoursLeft = reflectionDeadline ? hoursUntil(reflectionDeadline) : 0;

  const timeLabel = (() => {
    const start = formatTime(event.date);
    const end = event.endDate ? ` – ${formatTime(event.endDate)}` : "";
    return `${start}${end}`;
  })();

  // ── Shared: Header card + Roles section ────────────────────────────────────

  const HeaderCard = () => (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Banner */}
      <div className="relative h-52 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.bannerUrl ?? "/event-banner-placeholder.png"}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Upcoming/past tint overlay when using placeholder */}
        {!event.bannerUrl && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: upcoming
                ? "linear-gradient(135deg, #7C3AED, #A855F7)"
                : "rgba(39,39,42,0.8)",
            }}
          />
        )}
      </div>
      <div className="p-6 flex flex-col gap-4">
        {/* Status + chapter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              upcoming
                ? "bg-green-500/15 text-green-400"
                : "bg-zinc-700/40 text-zinc-400"
            }`}
          >
            {upcoming ? "UPCOMING" : "PAST"}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent-primary/20 text-accent-highlight font-medium">
            {event.chapterId}
          </span>
          {event.lumaUrl && (
            <a
              href={event.lumaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 rounded-full border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              View on Luma ↗
            </a>
          )}
        </div>

        {/* Name */}
        <h1 className="font-heading text-3xl sm:text-4xl text-text-primary leading-tight">
          {event.name}
        </h1>

        {/* Date & time */}
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <IconCalendar />
          <span>{formatDate(event.date)} · {timeLabel}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <IconPin />
          <span>{event.location}</span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-text-secondary text-sm leading-relaxed border-t border-border pt-4">
            {event.description}
          </p>
        )}

        {/* Capacity bar */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-text-secondary">Total Capacity</span>
            <span className="text-accent-highlight font-semibold">{totalFilled} / {totalSlots}</span>
          </div>
          <div className="h-1.5 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent-primary transition-all"
              style={{ width: totalSlots > 0 ? `${Math.min(100, (totalFilled / totalSlots) * 100)}%` : "0%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const RolesSection = () => (
    <div>
      <h2 className="font-heading text-sm text-text-muted uppercase tracking-wider mb-3">
        Volunteer Roles
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {event.roles.map((role) => {
          const filled = slotCounts[role.roleName] ?? 0;
          const pct = role.slots > 0 ? Math.min(100, (filled / role.slots) * 100) : 0;
          const full = filled >= role.slots;
          return (
            <div
              key={role.roleName}
              className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm text-text-primary">{role.roleName}</span>
                <span className="text-sm font-semibold text-accent-highlight">+{role.xpReward} XP</span>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={full ? "text-red-400" : "text-text-muted"}>
                    {full ? "Full" : `${role.slots - filled} slot${role.slots - filled !== 1 ? "s" : ""} left`}
                  </span>
                  <span className="text-text-muted">{filled}/{role.slots}</span>
                </div>
                <div className="h-1.5 rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all ${full ? "bg-red-500" : "bg-accent-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Coordinator view ─────────────────────────────────────────────────────────

  if (isCoord) {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link href="/events" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
              <IconBack />
            </Link>
            <h1 className="font-heading text-xl text-text-primary tracking-wide truncate max-w-xs">
              {event.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors text-sm font-heading"
            >
              <IconEdit />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-red-400 hover:border-red-500/40 transition-colors text-sm font-heading"
            >
              <IconTrash />
              Delete
            </button>
            <Link href="/notifications" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
              <IconBell />
            </Link>
            <Link href="/dashboard">
              <img src={avatarUrl} alt="Profile" width={36} height={36} className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors" />
            </Link>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border px-6">
          {(["details", "volunteers"] as CoordTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setCoordTab(tab)}
              className={`px-4 py-3 text-sm font-heading font-medium capitalize transition-colors border-b-2 -mb-px ${
                coordTab === tab
                  ? "border-accent-highlight text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab === "volunteers" ? `Volunteers (${allRegs.length})` : "Details"}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6">
          {coordTab === "details" && (
            <div className="max-w-2xl mx-auto flex flex-col gap-5">
              <HeaderCard />
              <RolesSection />
            </div>
          )}

          {coordTab === "volunteers" && (
            <div className="max-w-3xl mx-auto flex flex-col gap-5">
              {/* Scan feedback */}
              {scanFeedback && (
                <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${scanFeedback.ok ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                  {scanFeedback.ok ? <IconCheck /> : <IconX size={14} />}
                  {scanFeedback.msg}
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Registered", value: allRegs.length, color: "#A855F7" },
                  { label: "Confirmed", value: confirmed, color: "#06B6D4" },
                  { label: "Reflections", value: reflections, color: "#22C55E" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-surface border border-border rounded-xl p-4 text-center">
                    <p className="font-heading text-2xl font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs text-text-muted mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowQrScanner(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-accent-primary/50 rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <IconQr />
                  Scan QR
                </button>
                <button
                  onClick={confirmAll}
                  disabled={confirmingAll || allRegs.filter((r) => !r.attended).length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-accent-primary/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  {confirmingAll ? (
                    <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />)}</span>
                  ) : (
                    <IconCheck />
                  )}
                  Confirm All
                </button>
                <button
                  onClick={exportCsv}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-accent-primary/50 rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <IconDownload />
                  Export CSV
                </button>
              </div>

              {/* Volunteer list */}
              {allRegs.length === 0 ? (
                <div className="text-center py-16 text-text-muted text-sm">No volunteers registered yet.</div>
              ) : (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  {allRegs.map((reg, idx) => (
                    <div
                      key={reg.userId}
                      className={`flex items-center gap-4 px-5 py-4 ${idx < allRegs.length - 1 ? "border-b border-border" : ""}`}
                    >
                      <img
                        src={buildAvatarUrl(reg.username ?? reg.userId)}
                        alt=""
                        width={36}
                        height={36}
                        className="rounded-xl border border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary font-medium truncate">
                          {reg.username ?? reg.userId}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-text-muted">{reg.role}</span>
                          <span className="text-xs text-accent-highlight font-semibold">+{reg.roleXP} XP</span>
                          {reg.reflectionSubmitted && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">Reflected</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {reg.attended ? (
                          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-medium">
                            <IconCheck /> Confirmed
                          </span>
                        ) : (
                          <button
                            onClick={() => confirmAttendance(reg)}
                            disabled={confirmingId === reg.userId}
                            className="text-xs px-3 py-1.5 bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 rounded-lg text-white font-heading transition-colors"
                          >
                            {confirmingId === reg.userId ? "..." : "Confirm"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Energy report (post-event) */}
              {!upcoming && reflections > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <h3 className="font-heading text-sm text-text-muted uppercase tracking-wider mb-3">
                    Energy Report
                  </h3>
                  <p className="text-xs text-text-muted">
                    Anonymous energy data from {reflections} reflection{reflections !== 1 ? "s" : ""}.
                    Full breakdown available once volunteer reflections are loaded.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* QR Scanner modal */}
        {showQrScanner && (
          <QrScannerModal onScan={handleQrScan} onClose={() => setShowQrScanner(false)} />
        )}

        {/* Edit modal */}
        {showEditModal && event && (
          <EditEventModal
            event={event}
            onSave={handleSaveEdit}
            onClose={() => setShowEditModal(false)}
            saving={saving}
          />
        )}

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteConfirm(false)} />
            <div className="relative z-10 w-full max-w-sm border border-border rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: "#1e1a2e" }}>
              <div className="h-[3px] w-full bg-red-600" />
              <div className="p-6">
              <h3 className="font-heading text-xl text-text-primary mb-2">Delete Event?</h3>
              <p className="text-sm text-text-secondary mb-6">
                This will permanently delete <strong className="text-text-primary">{event?.name}</strong> and cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary text-sm font-heading transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-heading transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  ) : "Delete Event"}
                </button>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Volunteer view ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/events" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <IconBack />
          </Link>
          <h1 className="font-heading text-xl text-text-primary tracking-wide truncate max-w-xs">
            {event.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <IconBell />
          </Link>
          <Link href="/dashboard">
            <img src={avatarUrl} alt="Profile" width={36} height={36} className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors" />
          </Link>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">
          <HeaderCard />

          {/* Registration banner */}
          {joined && (
            <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/25 rounded-xl">
              <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <IconCheck />
              </span>
              <p className="text-sm text-green-400">
                You&rsquo;re registered as <strong>{myReg!.role}</strong> · +{myReg!.roleXP} XP on attendance
              </p>
            </div>
          )}

          {/* Reflection banners */}
          {reflectionOpen && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-orange-500/10 border border-orange-500/25 rounded-xl">
              <p className="text-sm text-orange-400">
                Submit your reflection — due in <strong>{hoursLeft}h</strong>
              </p>
              <Link
                href={`/events/${eventId}/reflect`}
                className="shrink-0 text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-400 rounded-lg text-white font-heading transition-colors"
              >
                Submit Now
              </Link>
            </div>
          )}
          {attended && reflectionSubmitted && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/25 rounded-xl">
              <IconCheck />
              <p className="text-sm text-green-400">Reflection submitted ✓</p>
            </div>
          )}
          {!upcoming && !attended && (
            <div className="px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-muted">
              This event has passed.
            </div>
          )}

          <RolesSection />

          {/* QR code */}
          {joined && myReg?.qrData && (
            <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
              <div>
                <h3 className="font-heading text-base text-text-primary text-center mb-1">Your QR Code</h3>
                <p className="text-xs text-text-muted text-center">Show this to your coordinator on the day of the event</p>
              </div>
              <div className="bg-white p-3 rounded-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(myReg.qrData)}&size=280x280&margin=4`}
                  alt="Your attendance QR code"
                  width={280}
                  height={280}
                  className="rounded-lg"
                />
              </div>
              <p className="text-xs text-text-muted font-mono text-center break-all px-2">
                {myReg.qrData}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Join button */}
      {upcoming && !joined && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-56 p-4 bg-gradient-to-t from-base via-base/95 to-transparent">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowRoleModal(true)}
              className="w-full py-4 bg-accent-highlight hover:bg-accent-primary rounded-2xl text-white font-heading font-medium text-base transition-colors shadow-lg shadow-accent-primary/25"
            >
              Join Event
            </button>
          </div>
        </div>
      )}

      {/* Role modal */}
      {showRoleModal && (
        <RoleModal
          roles={event.roles}
          slotCounts={slotCounts}
          onConfirm={handleJoin}
          onClose={() => setShowRoleModal(false)}
          loading={joiningLoading}
        />
      )}
    </div>
  );
}
