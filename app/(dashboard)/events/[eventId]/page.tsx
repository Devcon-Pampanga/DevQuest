"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, serverTimestamp, increment, addDoc,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const WAVE_COLORS = ["#F5C518", "#F97316", "#22C55E", "#9333EA", "#06B6D4"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvatarOptions {
  backgroundColor: string;
  backgroundType: "solid" | "gradientLinear";
  eyes: string;
  mouth: string;
}
interface UserData {
  uid: string; username: string; role: "volunteer" | "coordinator";
  chapterId: string; xp: number; avatarOptions?: AvatarOptions;
}
interface EventRole { roleName: string; slots: number; xpReward: number; }
interface EventDoc {
  eventId: string; name: string; description: string; date: Timestamp;
  endDate?: Timestamp; location: string; chapterId: string;
  roles: EventRole[]; lumaUrl?: string; bannerUrl?: string;
}
interface Registration {
  userId: string; role: string; roleXP: number; qrData: string;
  attended: boolean; reflectionSubmitted: boolean;
  reflectionDeadline?: Timestamp; confirmedAt?: Timestamp;
  confirmedBy?: string; username?: string;
  reflectionData?: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR: AvatarOptions = { backgroundColor: "5e35b1", backgroundType: "solid", eyes: "round", mouth: "smile01" };

function buildAvatarUrl(seed: string, opts?: AvatarOptions): string {
  const o = opts ?? DEFAULT_AVATAR;
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?${new URLSearchParams({ seed, backgroundColor: o.backgroundColor, backgroundType: o.backgroundType, eyes: o.eyes, mouth: o.mouth }).toString()}`;
}
function formatDate(ts: Timestamp): string {
  return ts.toDate().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function formatTime(ts: Timestamp): string {
  const d = ts.toDate();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function hoursUntil(ts: Timestamp): number { return Math.max(0, Math.floor((ts.toDate().getTime() - Date.now()) / 3600000)); }
function isUpcoming(ts: Timestamp): boolean { return ts.toDate() > new Date(); }
function tsToDateInput(ts: Timestamp): string { return ts.toDate().toISOString().slice(0, 10); }
function tsToTimeInput(ts: Timestamp): string {
  const d = ts.toDate();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBack() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>; }
function IconBell() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function IconCalendar() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IconPin() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function IconCheck() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconX({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconQr() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 21h.01M21 14h.01M21 21h.01"/></svg>; }
function IconDownload() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconEdit() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconTrash() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function IconUpload() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }

// ─── Edit Event Modal ─────────────────────────────────────────────────────────

const EDIT_INPUT = "w-full bg-[#0a0a0f] border border-[#27272A] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#52525B] focus:outline-none focus:ring-2 focus:ring-[#A855F7] transition-shadow";
const EDIT_LABEL = "block text-[11px] font-sans uppercase tracking-widest text-[#A1A1AA] mb-2";

interface EditFields { name: string; description: string; date: string; startTime: string; endTime: string; location: string; lumaUrl: string; }

function EditEventModal({ event, onSave, onClose, saving }: { event: EventDoc; onSave: (fields: EditFields, bannerFile: File | null) => void; onClose: () => void; saving: boolean; }) {
  const [fields, setFields] = useState<EditFields>({ name: event.name, description: event.description ?? "", date: tsToDateInput(event.date), startTime: tsToTimeInput(event.date), endTime: event.endDate ? tsToTimeInput(event.endDate) : "", location: event.location, lumaUrl: event.lumaUrl ?? "" });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  function set(key: keyof EditFields, value: string) { setFields((prev) => ({ ...prev, [key]: value })); }
  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0] ?? null; setBannerFile(file); if (file) setBannerPreview(URL.createObjectURL(file)); }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#27272A] overflow-hidden shadow-2xl" style={{ backgroundColor: "#1e1a2e" }}>
        <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #7C3AED, #A855F7)" }} />
        <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-minimal">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-xl text-white">Edit Event</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#52525B] hover:text-white hover:bg-white/5 transition-colors"><IconX /></button>
          </div>
          <div className="flex flex-col gap-4">
            <div><label className={EDIT_LABEL}>Event Name *</label><input type="text" value={fields.name} onChange={(e) => set("name", e.target.value)} className={EDIT_INPUT} /></div>
            <div><label className={EDIT_LABEL}>Description</label><textarea rows={3} value={fields.description} onChange={(e) => set("description", e.target.value)} className={`${EDIT_INPUT} resize-none`} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={EDIT_LABEL}>Date *</label><input type="date" value={fields.date} onChange={(e) => set("date", e.target.value)} className={EDIT_INPUT} style={{ colorScheme: "dark" }} /></div>
              <div><label className={EDIT_LABEL}>Start Time</label><input type="time" value={fields.startTime} onChange={(e) => set("startTime", e.target.value)} className={EDIT_INPUT} style={{ colorScheme: "dark" }} /></div>
              <div><label className={EDIT_LABEL}>End Time</label><input type="time" value={fields.endTime} onChange={(e) => set("endTime", e.target.value)} className={EDIT_INPUT} style={{ colorScheme: "dark" }} /></div>
            </div>
            <div><label className={EDIT_LABEL}>Location *</label><input type="text" value={fields.location} onChange={(e) => set("location", e.target.value)} className={EDIT_INPUT} /></div>
            <div><label className={EDIT_LABEL}>Luma Link</label><input type="url" value={fields.lumaUrl} onChange={(e) => set("lumaUrl", e.target.value)} className={EDIT_INPUT} placeholder="https://lu.ma/your-event" /></div>
            <div>
              <label className={EDIT_LABEL}>Banner Image</label>
              <div className="rounded-xl overflow-hidden border border-[#27272A] bg-[#0a0a0f]">
                {(bannerPreview || event.bannerUrl) && (<img src={bannerPreview ?? event.bannerUrl} alt="Banner preview" className="w-full h-28 object-cover opacity-80" />)}
                <label className="flex items-center justify-center gap-2 py-3 cursor-pointer hover:bg-white/5 transition-colors text-sm text-[#A1A1AA] hover:text-white"><IconUpload />{bannerFile ? bannerFile.name : "Replace banner…"}<input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} /></label>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-[#A1A1AA] text-sm font-heading transition-colors">Cancel</button>
            <button onClick={() => onSave(fields, bannerFile)} disabled={saving || !fields.name.trim() || !fields.date || !fields.location.trim()} className="flex-1 py-3 rounded-xl bg-[#A855F7] hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-heading transition-colors flex items-center justify-center gap-2">
              {saving ? <span className="flex gap-1">{[0,1,2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white animate-[wave-dot_0.6s_ease-in-out_infinite]" style={{ animationDelay: `${i*0.15}s` }} />)}</span> : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Role Selection Modal ─────────────────────────────────────────────────────

function RoleModal({ roles, slotCounts, onConfirm, onClose, loading }: { roles: EventRole[]; slotCounts: Record<string, number>; onConfirm: (role: EventRole) => void; onClose: () => void; loading: boolean; }) {
  const [selected, setSelected] = useState<EventRole | null>(null);
  const available = roles.filter((r) => (slotCounts[r.roleName] ?? 0) < r.slots);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-elevated border border-border rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-xl text-text-primary">Choose Your Role</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"><IconX /></button>
        </div>
        {available.length === 0 ? <p className="text-text-secondary text-sm text-center py-6">All roles are fully booked.</p> : (
          <div className="flex flex-col gap-2 mb-5">
            {available.map((role) => {
              const filled = slotCounts[role.roleName] ?? 0; const remaining = role.slots - filled; const isSelected = selected?.roleName === role.roleName;
              return (
                <button key={role.roleName} onClick={() => setSelected(role)} className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${isSelected ? "border-accent-highlight bg-accent-highlight/10" : "border-border bg-surface hover:border-accent-primary/50"}`}>
                  <div><span className={`font-heading text-sm ${isSelected ? "text-text-primary" : "text-text-secondary"}`}>{role.roleName}</span><p className="text-xs text-text-muted mt-0.5">{remaining} slot{remaining !== 1 ? "s" : ""} left</p></div>
                  <div className="flex items-center gap-3"><span className="text-sm font-semibold text-accent-highlight">+{role.xpReward} XP</span>{isSelected && <span className="w-5 h-5 rounded-full bg-accent-highlight flex items-center justify-center"><IconCheck /></span>}</div>
                </button>
              );
            })}
          </div>
        )}
        <button onClick={() => selected && onConfirm(selected)} disabled={!selected || loading} className="w-full py-3 bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-heading font-medium transition-colors flex items-center justify-center gap-2">
          {loading ? <span className="flex gap-1">{WAVE_COLORS.map((color, i) => <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i*0.1}s` }} />)}</span> : "Confirm Registration"}
        </button>
      </div>
    </div>
  );
}

// ─── QR Scanner Modal ─────────────────────────────────────────────────────────

function QrScannerModal({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void; }) {
  const [scannerReady, setScannerReady] = useState(false);
  const [scanError, setScanError] = useState("");
  useEffect(() => {
    let scanner: { clear: () => void } | null = null;
    (async () => {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        const s = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
        s.render((decodedText: string) => { onScan(decodedText); s.clear().catch(() => {}); }, () => {});
        scanner = s; setScannerReady(true);
      } catch { setScanError("Camera not available or permission denied."); }
    })();
    return () => { if (scanner) { try { scanner.clear(); } catch { /* ignore */ } } };
  }, [onScan]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-elevated border border-border rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-text-primary">Scan Volunteer QR</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"><IconX /></button>
        </div>
        <p className="text-xs text-text-muted mb-4">Point the camera at a volunteer&apos;s DevQuest QR code.</p>
        {scanError ? <div className="text-center py-8 text-red-400 text-sm">{scanError}</div> : <div id="qr-reader" className="rounded-xl overflow-hidden" />}
        {!scannerReady && !scanError && <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-elevated"><div className="flex gap-1.5">{[0,1,2].map((i) => <span key={i} className="w-2 h-2 rounded-full bg-accent-highlight animate-[wave-dot_0.6s_ease-in-out_infinite]" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type CoordTab    = "details" | "volunteers" | "reflection";
type VolunteerTab = "details" | "reflection";

export default function EventDetailPage() {
  const router      = useRouter();
  const params      = useParams();
  const searchParams = useSearchParams();
  const justReflected = searchParams.get("reflected") === "1";
  const eventId     = params.eventId as string;

  const [authChecked,   setAuthChecked]   = useState(false);
  const [userData,      setUserData]      = useState<UserData | null>(null);
  const [firebaseUser,  setFirebaseUser]  = useState<FirebaseUser | null>(null);
  const [event,         setEvent]         = useState<EventDoc | null>(null);
  const [myReg,         setMyReg]         = useState<Registration | null>(null);
  const [allRegs,       setAllRegs]       = useState<Registration[]>([]);
  const [slotCounts,    setSlotCounts]    = useState<Record<string, number>>({});
  const [loading,       setLoading]       = useState(true);

  const [showRoleModal,      setShowRoleModal]      = useState(false);
  const [joiningLoading,     setJoiningLoading]     = useState(false);
  const [showQrScanner,      setShowQrScanner]      = useState(false);
  const [coordTab,           setCoordTab]           = useState<CoordTab>("details");
  const [volunteerTab,       setVolunteerTab]       = useState<VolunteerTab>("details");
  const [confirmingId,       setConfirmingId]       = useState<string | null>(null);
  const [confirmingAll,      setConfirmingAll]      = useState(false);
  const [scanFeedback,       setScanFeedback]       = useState<{ ok: boolean; msg: string } | null>(null);
  const [showEditModal,      setShowEditModal]      = useState(false);
  const [saving,             setSaving]             = useState(false);
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);
  const [deleting,           setDeleting]           = useState(false);
  const [reflectionDone,     setReflectionDone]     = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data()?.onboardingComplete !== true) { router.replace("/onboarding"); return; }
      const data = snap.data() as UserData;
      setFirebaseUser(user); setUserData({ ...data, uid: user.uid }); setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  const fetchData = useCallback(async () => {
    if (!userData) return;
    setLoading(true);
    try {
      const eventSnap = await getDoc(doc(db, "events", eventId));
      if (!eventSnap.exists()) { router.replace("/events"); return; }
      setEvent({ eventId: eventSnap.id, ...eventSnap.data() } as EventDoc);

      const myRegSnap = await getDoc(doc(db, "events", eventId, "registrations", userData.uid));
      const myRegData = myRegSnap.exists() ? (myRegSnap.data() as Registration) : null;
      setMyReg(myRegData);
      if (myRegData?.reflectionSubmitted) setReflectionDone(true);

      const allRegsSnap = await getDocs(collection(db, "events", eventId, "registrations"));
      const regs: Registration[] = [];
      const counts: Record<string, number> = {};
      for (const d of allRegsSnap.docs) {
        const reg = d.data() as Registration;
        regs.push(reg); counts[reg.role] = (counts[reg.role] ?? 0) + 1;
      }
      if (userData.role === "coordinator") {
        const withNames = await Promise.all(regs.map(async (reg) => {
          try { const u = await getDoc(doc(db, "users", reg.userId)); return { ...reg, username: u.data()?.username ?? reg.userId }; }
          catch { return { ...reg, username: reg.userId }; }
        }));
        setAllRegs(withNames);
      }
      setSlotCounts(counts);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [userData, eventId, router]);

  useEffect(() => { if (authChecked) fetchData(); }, [authChecked, fetchData]);

  async function handleJoin(role: EventRole) {
    if (!firebaseUser || !event) return;
    setJoiningLoading(true);
    try {
      const qrData = `devquest://attendance?eventId=${eventId}&userId=${firebaseUser.uid}&role=${encodeURIComponent(role.roleName)}`;
      await setDoc(doc(db, "events", eventId, "registrations", firebaseUser.uid), { userId: firebaseUser.uid, role: role.roleName, roleXP: role.xpReward, qrData, attended: false, reflectionSubmitted: false });
      setShowRoleModal(false); await fetchData();
    } catch (err) { console.error(err); } finally { setJoiningLoading(false); }
  }

  async function confirmAttendance(reg: Registration) {
    if (!firebaseUser) return;
    setConfirmingId(reg.userId);
    try {
      const deadline = Timestamp.fromDate(new Date(Date.now() + 72 * 60 * 60 * 1000));
      await updateDoc(doc(db, "events", eventId, "registrations", reg.userId), { attended: true, confirmedAt: serverTimestamp(), confirmedBy: firebaseUser.uid, reflectionDeadline: deadline });
      await updateDoc(doc(db, "users", reg.userId), { xp: increment(reg.roleXP) });
      await addDoc(collection(db, "users", reg.userId, "xpLog"), { source: "event_attendance", sourceId: eventId, description: `Attended ${event?.name ?? "event"} as ${reg.role}`, xp: reg.roleXP, createdAt: serverTimestamp() });
      await addDoc(collection(db, "users", reg.userId, "notifications"), { type: "attendance_confirmed", message: `Your attendance at ${event?.name ?? "the event"} has been confirmed. +${reg.roleXP} XP!`, read: false, relatedId: eventId, createdAt: serverTimestamp() });
      await fetchData();
    } catch (err) { console.error(err); } finally { setConfirmingId(null); }
  }

  async function confirmAll() {
    const unconfirmed = allRegs.filter((r) => !r.attended);
    if (!unconfirmed.length) return;
    setConfirmingAll(true);
    for (const reg of unconfirmed) await confirmAttendance(reg);
    setConfirmingAll(false);
  }

  const handleQrScan = useCallback(async (data: string) => {
    setShowQrScanner(false);
    try {
      const url = new URL(data.replace("devquest://", "https://devquest.app/"));
      const scannedEventId = url.searchParams.get("eventId");
      const scannedUserId  = url.searchParams.get("userId");
      if (scannedEventId !== eventId || !scannedUserId) { setScanFeedback({ ok: false, msg: "Invalid QR code — wrong event." }); return; }
      const regSnap = await getDoc(doc(db, "events", eventId, "registrations", scannedUserId));
      if (!regSnap.exists()) { setScanFeedback({ ok: false, msg: "No registration found for this volunteer." }); return; }
      const reg = regSnap.data() as Registration;
      if (reg.attended) { setScanFeedback({ ok: false, msg: "Already marked as attended." }); return; }
      await confirmAttendance(reg);
      setScanFeedback({ ok: true, msg: `Attendance confirmed for ${reg.userId}.` });
    } catch { setScanFeedback({ ok: false, msg: "Failed to parse QR code." }); }
    setTimeout(() => setScanFeedback(null), 4000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleSaveEdit(fields: EditFields, bannerFile: File | null) {
    setSaving(true);
    try {
      const startTs = Timestamp.fromDate(new Date(`${fields.date}T${fields.startTime || "00:00"}`));
      const endTs   = fields.endTime ? Timestamp.fromDate(new Date(`${fields.date}T${fields.endTime}`)) : null;
      const updates: Record<string, unknown> = { name: fields.name.trim(), description: fields.description.trim(), date: startTs, location: fields.location.trim() };
      if (endTs) updates.endDate = endTs;
      if (fields.lumaUrl.trim()) updates.lumaUrl = fields.lumaUrl.trim();
      if (bannerFile) {
        const bannerRef = ref(storage, `event-banners/${eventId}/banner`);
        try { await deleteObject(bannerRef); } catch { /* ok */ }
        await uploadBytes(bannerRef, bannerFile);
        updates.bannerUrl = await getDownloadURL(bannerRef);
      }
      await updateDoc(doc(db, "events", eventId), updates);
      await fetchData(); setShowEditModal(false);
    } catch (err) { console.error(err); } finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      if (event?.bannerUrl) { try { await deleteObject(ref(storage, `event-banners/${eventId}/banner`)); } catch { /* ok */ } }
      await deleteDoc(doc(db, "events", eventId));
      router.replace("/events");
    } catch (err) { console.error(err); setDeleting(false); }
  }

  function exportCsv() {
    const csv = ["Username,Role,XP,Attended,Reflection Submitted", ...allRegs.map((r) => [r.username ?? r.userId, r.role, r.roleXP, r.attended, r.reflectionSubmitted].join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `${event?.name ?? "event"}-volunteers.csv`; a.click();
  }

  if (!authChecked || !userData) return null;

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions);
  const isCoord   = userData.role === "coordinator";

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link href="/events" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"><IconBack /></Link>
            <div className="h-6 w-40 rounded-lg bg-surface animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="flex gap-2">{WAVE_COLORS.map((color, i) => <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i*0.1}s` }} />)}</div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const upcoming     = isUpcoming(event.date);
  const totalSlots   = event.roles.reduce((s, r) => s + r.slots, 0);
  const totalFilled  = Object.values(slotCounts).reduce((s, c) => s + c, 0);
  const confirmed    = allRegs.filter((r) => r.attended).length;
  const reflections  = allRegs.filter((r) => r.reflectionSubmitted).length;

  const joined               = !!myReg;
  const attended             = myReg?.attended ?? false;
  const reflectionSubmitted  = reflectionDone || (myReg?.reflectionSubmitted ?? false);
  const reflectionDeadline   = myReg?.reflectionDeadline;
  const hoursLeft            = reflectionDeadline ? hoursUntil(reflectionDeadline) : 0;

  const timeLabel = (() => { const s = formatTime(event.date); const e = event.endDate ? ` – ${formatTime(event.endDate)}` : ""; return `${s}${e}`; })();

  const HeaderCard = () => (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="relative h-52 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.bannerUrl ?? "/event-banner-placeholder.png"} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {!event.bannerUrl && <div className="absolute inset-0 opacity-40" style={{ background: upcoming ? "linear-gradient(135deg,#7C3AED,#A855F7)" : "rgba(39,39,42,0.8)" }} />}
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${upcoming ? "bg-green-500/15 text-green-400" : "bg-zinc-700/40 text-zinc-400"}`}>{upcoming ? "UPCOMING" : "PAST"}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent-primary/20 text-accent-highlight font-medium">{event.chapterId}</span>
          {event.lumaUrl && <a href={event.lumaUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1 rounded-full border border-border text-text-muted hover:text-text-secondary transition-colors">View on Luma ↗</a>}
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl text-text-primary leading-tight">{event.name}</h1>
        <div className="flex items-center gap-2 text-text-secondary text-sm"><IconCalendar /><span>{formatDate(event.date)} · {timeLabel}</span></div>
        <div className="flex items-center gap-2 text-text-secondary text-sm"><IconPin /><span>{event.location}</span></div>
        {event.description && <p className="text-text-secondary text-sm leading-relaxed border-t border-border pt-4">{event.description}</p>}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm mb-1.5"><span className="text-text-secondary">Total Capacity</span><span className="text-accent-highlight font-semibold">{totalFilled} / {totalSlots}</span></div>
          <div className="h-1.5 rounded-full bg-border"><div className="h-full rounded-full bg-accent-primary transition-all" style={{ width: totalSlots > 0 ? `${Math.min(100,(totalFilled/totalSlots)*100)}%` : "0%" }} /></div>
        </div>
      </div>
    </div>
  );

  const RolesSection = () => (
    <div>
      <h2 className="font-heading text-sm text-text-muted uppercase tracking-wider mb-3">Volunteer Roles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {event.roles.map((role) => {
          const filled = slotCounts[role.roleName] ?? 0; const pct = role.slots > 0 ? Math.min(100,(filled/role.slots)*100) : 0; const full = filled >= role.slots;
          return (
            <div key={role.roleName} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between"><span className="font-heading text-sm text-text-primary">{role.roleName}</span><span className="text-sm font-semibold text-accent-highlight">+{role.xpReward} XP</span></div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1"><span className={full ? "text-red-400" : "text-text-muted"}>{full ? "Full" : `${role.slots-filled} slot${role.slots-filled!==1?"s":""} left`}</span><span className="text-text-muted">{filled}/{role.slots}</span></div>
                <div className="h-1.5 rounded-full bg-border"><div className={`h-full rounded-full transition-all ${full?"bg-red-500":"bg-accent-primary"}`} style={{ width:`${pct}%` }} /></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── COORDINATOR VIEW ─────────────────────────────────────────────────────────

  if (isCoord) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link href="/events" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"><IconBack /></Link>
            <h1 className="font-heading text-xl text-text-primary tracking-wide truncate max-w-xs">{event.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEditModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors text-sm font-heading"><IconEdit />Edit</button>
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-red-400 hover:border-red-500/40 transition-colors text-sm font-heading"><IconTrash />Delete</button>
            <Link href="/notifications" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"><IconBell /></Link>
            <Link href="/dashboard"><img src={avatarUrl} alt="Profile" width={36} height={36} className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors" /></Link>
          </div>
        </div>

        <div className="flex border-b border-border px-6">
          {(["details", "volunteers", "reflection"] as CoordTab[]).map((tab) => (
            <button key={tab} onClick={() => setCoordTab(tab)}
              className={`px-4 py-3 text-sm font-heading font-medium capitalize transition-colors border-b-2 -mb-px flex items-center gap-2 ${coordTab === tab ? "border-accent-highlight text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}>
              {tab === "volunteers" ? `Volunteers (${allRegs.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "reflection" && reflections > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-mono">{reflections}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6">
          {coordTab === "details" && <div className="max-w-2xl mx-auto flex flex-col gap-5"><HeaderCard /><RolesSection /></div>}

          {coordTab === "volunteers" && (
            <div className="max-w-3xl mx-auto flex flex-col gap-5">
              {scanFeedback && <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${scanFeedback.ok ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>{scanFeedback.ok ? <IconCheck /> : <IconX size={14} />}{scanFeedback.msg}</div>}
              <div className="grid grid-cols-3 gap-3">
                {[{label:"Registered",value:allRegs.length,color:"#A855F7"},{label:"Confirmed",value:confirmed,color:"#22C55E"},{label:"Reflections",value:reflections,color:"#06B6D4"}].map(({label,value,color}) => (
                  <div key={label} className="bg-surface border border-border rounded-xl p-4 text-center"><p className="font-heading text-2xl font-bold" style={{color}}>{value}</p><p className="text-xs text-text-muted mt-1">{label}</p></div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowQrScanner(true)} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-accent-primary/50 rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"><IconQr />Scan QR</button>
                <button onClick={confirmAll} disabled={confirmingAll || allRegs.filter((r) => !r.attended).length === 0} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-accent-primary/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors">
                  {confirmingAll ? <span className="flex gap-1">{WAVE_COLORS.map((color,i) => <span key={i} className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:color,animation:"wave-dot 0.6s ease-in-out infinite",animationDelay:`${i*0.1}s`}} />)}</span> : <IconCheck />}Confirm All
                </button>
                <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-accent-primary/50 rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"><IconDownload />Export CSV</button>
              </div>
              {allRegs.length === 0 ? <div className="text-center py-16 text-text-muted text-sm">No volunteers registered yet.</div> : (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  {allRegs.map((reg, idx) => (
                    <div key={reg.userId} className={`flex items-center gap-4 px-5 py-4 ${idx < allRegs.length-1 ? "border-b border-border" : ""}`}>
                      <img src={buildAvatarUrl(reg.username ?? reg.userId)} alt="" width={36} height={36} className="rounded-xl border border-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary font-medium truncate">{reg.username ?? reg.userId}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-text-muted">{reg.role}</span>
                          <span className="text-xs text-accent-highlight font-semibold">+{reg.roleXP} XP</span>
                          {reg.reflectionSubmitted && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">Reflected</span>}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {reg.attended ? <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-medium"><IconCheck /> Confirmed</span>
                          : <button onClick={() => confirmAttendance(reg)} disabled={confirmingId === reg.userId} className="text-xs px-3 py-1.5 bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 rounded-lg text-white font-heading transition-colors">{confirmingId === reg.userId ? "..." : "Confirm"}</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!upcoming && reflections > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <h3 className="font-heading text-sm text-text-muted uppercase tracking-wider mb-3">Energy Report</h3>
                  <p className="text-xs text-text-muted">Anonymous energy data from {reflections} reflection{reflections!==1?"s":""}.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Coordinator Reflection Tab ── */}
          {coordTab === "reflection" && (
            <div className="max-w-3xl mx-auto">
              {reflections === 0 ? (
                <div className="text-center py-16 text-text-muted text-sm bg-surface border border-border rounded-2xl">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-heading text-text-secondary mb-1">No reflections yet</p>
                  <p>Reflections will appear here once volunteers submit them.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">

                  {/* ── Data Preview ── */}
                  <ReflectionDataPreview regs={allRegs.filter((r) => r.reflectionSubmitted)} total={allRegs.length} chapterId={event.chapterId} />

                  {/* ── Individual cards ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-heading text-base text-text-primary">Individual Responses</h2>
                      <span className="text-sm text-text-muted">{reflections} of {allRegs.length} submitted</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {allRegs.filter((r) => r.reflectionSubmitted).map((reg) => (
                        <ReflectionCard key={reg.userId} reg={reg} eventId={eventId} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showQrScanner && <QrScannerModal onScan={handleQrScan} onClose={() => setShowQrScanner(false)} />}
        {showEditModal && event && <EditEventModal event={event} onSave={handleSaveEdit} onClose={() => setShowEditModal(false)} saving={saving} />}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteConfirm(false)} />
            <div className="relative z-10 w-full max-w-sm border border-border rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: "#1e1a2e" }}>
              <div className="h-[3px] w-full bg-red-600" />
              <div className="p-6">
                <h3 className="font-heading text-xl text-text-primary mb-2">Delete Event?</h3>
                <p className="text-sm text-text-secondary mb-6">This will permanently delete <strong className="text-text-primary">{event?.name}</strong> and cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary text-sm font-heading transition-colors disabled:opacity-50">Cancel</button>
                  <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-heading transition-colors flex items-center justify-center gap-2">
                    {deleting ? <span className="flex gap-1">{WAVE_COLORS.map((color,i) => <span key={i} className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:color,animation:"wave-dot 0.6s ease-in-out infinite",animationDelay:`${i*0.15}s`}} />)}</span> : "Delete Event"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── VOLUNTEER VIEW ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/events" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"><IconBack /></Link>
          <h1 className="font-heading text-xl text-text-primary tracking-wide truncate max-w-xs">{event.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"><IconBell /></Link>
          <Link href="/dashboard"><img src={avatarUrl} alt="Profile" width={36} height={36} className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors" /></Link>
        </div>
      </div>

      <div className="flex-1 p-6">
        {volunteerTab === "details" && (
          <div className="max-w-2xl mx-auto flex flex-col gap-5">
            <HeaderCard />
            {joined && (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/25 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0"><IconCheck /></span>
                <p className="text-sm text-green-400">You&rsquo;re registered as <strong>{myReg!.role}</strong> · +{myReg!.roleXP} XP on attendance</p>
              </div>
            )}
            {(justReflected || reflectionSubmitted) && !upcoming && (
              <div className="flex items-center gap-3 px-5 py-4 bg-green-500/10 border border-green-500/25 rounded-xl">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-heading font-semibold text-green-400">Reflection Submitted!</p>
                  <p className="text-xs text-text-muted mt-0.5">+25 XP has been added to your account. Great work!</p>
                </div>
              </div>
            )}
            {!upcoming && !reflectionSubmitted && !justReflected && (
              <Link href={`/events/${eventId}/reflection`} className="w-full flex items-center justify-between px-5 py-4 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/15 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div className="text-left">
                    <p className="text-sm font-heading font-semibold text-orange-400">Submit Reflection</p>
                    <p className="text-xs text-text-muted mt-0.5">Complete your post-event reflection · Earn <span className="text-yellow-400 font-semibold">+25 XP</span></p>
                  </div>
                </div>
                <span className="text-orange-400 text-lg group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            )}
            {!upcoming && reflectionSubmitted && !justReflected && (
              <div className="flex items-center gap-3 px-5 py-4 bg-green-500/10 border border-green-500/25 rounded-xl">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-sm font-heading font-semibold text-green-400">Reflection Submitted</p>
                  <p className="text-xs text-text-muted mt-0.5">+25 XP has been added to your account.</p>
                </div>
              </div>
            )}
            <RolesSection />
            {joined && myReg?.qrData && (
              <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
                <div><h3 className="font-heading text-base text-text-primary text-center mb-1">Your QR Code</h3><p className="text-xs text-text-muted text-center">Show this to your coordinator on the day of the event</p></div>
                <div className="bg-white p-3 rounded-xl"><img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(myReg.qrData)}&size=280x280&margin=4`} alt="Your attendance QR code" width={280} height={280} className="rounded-lg" /></div>
                <p className="text-xs text-text-muted font-mono text-center break-all px-2">{myReg.qrData}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {upcoming && !joined && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-56 p-4 bg-gradient-to-t from-base via-base/95 to-transparent">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setShowRoleModal(true)} className="w-full py-4 bg-accent-highlight hover:bg-accent-primary rounded-2xl text-white font-heading font-medium text-base transition-colors shadow-lg shadow-accent-primary/25">Join Event</button>
          </div>
        </div>
      )}

      {showRoleModal && <RoleModal roles={event.roles} slotCounts={slotCounts} onConfirm={handleJoin} onClose={() => setShowRoleModal(false)} loading={joiningLoading} />}
    </div>
  );
}

// ─── ReflectionCard — clickable, navigates to full reflection page ─────────────

function ReflectionCard({ reg, eventId }: { reg: Registration; eventId: string }) {
  const d = reg.reflectionData as {
    firstName?: string; lastName?: string; rolePosition?: string;
    ratings?: Record<string, number>; insights?: string;
  } | undefined;

  const fullName = d?.firstName
    ? `${d.firstName} ${d.lastName ?? ""}`.trim()
    : (reg.username ?? reg.userId);

  return (
    <Link
      href={`/events/${eventId}/reflections/${reg.userId}`}
      className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-accent-primary/50 hover:bg-white/5 transition-all group"
    >
      <img src={buildAvatarUrl(reg.username ?? reg.userId)} alt="" width={44} height={44} className="rounded-xl border border-border shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-heading font-semibold text-text-primary">{fullName}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {(d?.rolePosition || reg.role) && <span className="text-xs text-text-muted">{d?.rolePosition ?? reg.role}</span>}
          {d?.ratings && <span className="text-xs px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-highlight">{Object.keys(d.ratings).length} ratings</span>}
          <span className="text-xs text-green-400">Submitted ✓</span>
        </div>
        {d?.insights && <p className="text-xs text-text-muted mt-1.5 truncate">{d.insights}</p>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0 text-text-muted group-hover:text-accent-highlight group-hover:translate-x-1 transition-all">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

// ─── ReflectionDataPreview ────────────────────────────────────────────────────

const LIKERT_QUESTIONS = [
  { key: "q1", label: "My Volunteer Role/s and Responsibility/ies were clearly stated",                          section: "pre"    },
  { key: "q2", label: "Reporting instructions were clearly stated",                                              section: "pre"    },
  { key: "q3", label: "Reporting instructions were complete (what to wear, time, location, access to location)", section: "pre"    },
  { key: "q4", label: "I received enough materials, time, and support to adequately prepare for my role",        section: "pre"    },
  { key: "q5", label: "I felt overwhelmed",                                                                      section: "during", reversed: true },
  { key: "q6", label: "I felt my work was essential for the success of the event",                               section: "during" },
  { key: "q7", label: "I was given enough time to do tasks assigned to me",                                      section: "during" },
  { key: "q8", label: "I had access to help anytime I needed it to complete tasks associated with my role",      section: "during" },
];

const MOODS = [
  { key: "drained",   emoji: "🥱", label: "Drained"   },
  { key: "okay",      emoji: "🙂", label: "Okay"      },
  { key: "good",      emoji: "😊", label: "Good"      },
  { key: "energized", emoji: "🔥", label: "Energized" },
];

function QuestionChart({ label, counts, total }: {
  label: string;
  counts: number[];  // index 0 = rating 1, index 4 = rating 5
  total: number;
}) {
  const max = Math.max(...counts, 1);
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-sm font-heading text-text-primary mb-1">{label}</p>
      <p className="text-xs text-text-muted mb-4">{total} response{total !== 1 ? "s" : ""}</p>
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((rating, idx) => {
          const count = counts[idx] ?? 0;
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          const barW  = max > 0 ? Math.round((count / max) * 100) : 0;
          return (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-4 text-right shrink-0">{rating}</span>
              <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded transition-all flex items-center"
                  style={{ width: `${barW}%`, minWidth: count > 0 ? "2px" : "0" }}
                />
              </div>
              <span className="text-xs text-text-muted w-24 shrink-0">
                {count > 0 ? `${count} (${pct}%)` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReflectionDataPreview({ regs, total, chapterId }: { regs: Registration[]; total: number; chapterId: string }) {
  // Build per-question rating distribution (counts[q][rating 1-5])
  const distributions: Record<string, number[]> = {};
  LIKERT_QUESTIONS.forEach(({ key }) => {
    distributions[key] = [0, 0, 0, 0, 0];
  });

  regs.forEach((r) => {
    const ratings = (r.reflectionData as Record<string, unknown> | undefined)?.ratings as Record<string, number> | undefined;
    if (!ratings) return;
    LIKERT_QUESTIONS.forEach(({ key }) => {
      const val = ratings[key];
      if (val >= 1 && val <= 5) distributions[key][val - 1]++;
    });
  });

  // Averages for summary cards
  function avg(keys: string[]) {
    const vals = keys.flatMap((k) =>
      distributions[k].flatMap((count, idx) => Array(count).fill(idx + 1))
    );
    return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
  }
  const avgPre  = avg(["q1","q2","q3","q4"]);
  const avgDur  = avg(["q6","q7","q8"]);

  // Mood counts
  const moodCounts: Record<string, number> = {};
  regs.forEach((r) => {
    const mood = (r.reflectionData as Record<string, unknown> | undefined)?.mood as string | undefined;
    if (mood) moodCounts[mood] = (moodCounts[mood] ?? 0) + 1;
  });
  const positivePct = regs.length > 0
    ? Math.round((((moodCounts["good"] ?? 0) + (moodCounts["energized"] ?? 0)) / regs.length) * 100)
    : 0;

  // Insights
  const insights = regs
    .map((r) => ({
      name: (r.reflectionData as Record<string, unknown> | undefined)?.firstName as string ?? r.username ?? r.userId,
      text: (r.reflectionData as Record<string, unknown> | undefined)?.insights as string | undefined,
    }))
    .filter((i) => i.text);

  const preQuestions    = LIKERT_QUESTIONS.filter((q) => q.section === "pre");
  const duringQuestions = LIKERT_QUESTIONS.filter((q) => q.section === "during");

  return (
    <div className="flex flex-col gap-5">

      {/* Chapter card — count per chapter chosen by volunteers */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <p className="text-sm font-heading text-text-primary mb-1">
          From what DEVCON Kids chapter is hosting this event?
        </p>
        <p className="text-xs text-text-muted mb-4">{regs.length} response{regs.length !== 1 ? "s" : ""}</p>
        <div className="flex flex-col gap-2">
          {(() => {
            // Count per chapter from reflectionData.chapterId
            const counts: Record<string, number> = {};
            regs.forEach((r) => {
              const ch = (r.reflectionData as Record<string, unknown> | undefined)?.chapterId as string | undefined
                ?? chapterId; // fallback to event chapterId for old submissions
              if (ch) counts[ch] = (counts[ch] ?? 0) + 1;
            });
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            const max = sorted[0]?.[1] ?? 1;
            return sorted.map(([chapter, count]) => {
              const pct  = regs.length > 0 ? Math.round((count / regs.length) * 100) : 0;
              const barW = Math.round((count / max) * 100);
              const name = chapter.replace("DEVCON Kids ", "");
              return (
                <div key={chapter} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-28 shrink-0 truncate">{name}</span>
                  <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full bg-accent-primary rounded flex items-center px-2"
                      style={{ width: `${barW}%`, minWidth: count > 0 ? "2px" : "0" }}
                    >
                      {barW > 20 && <span className="text-xs font-bold text-white truncate">{name}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-text-muted w-20 shrink-0 text-right">{count} ({pct}%)</span>
                </div>
              );
            });
          })()}
        </div>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Reflections",   value: `${regs.length}/${total}`, color: "text-accent-highlight" },
          { label: "Avg pre-event", value: avgPre.toFixed(1),         color: "text-purple-400"       },
          { label: "Avg during",    value: avgDur.toFixed(1),         color: "text-cyan-400"         },
          { label: "Positive mood", value: `${positivePct}%`,         color: "text-green-400"        },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className={`font-heading text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Pre-event section */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-2 w-2 rounded-full bg-accent-highlight" />
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Pre-event preparation</p>
        </div>
        <div className="flex flex-col gap-3">
          {preQuestions.map(({ key, label }) => (
            <QuestionChart key={key} label={label} counts={distributions[key]} total={regs.length} />
          ))}
        </div>
      </div>

      {/* During event section */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-2 w-2 rounded-full bg-cyan-400" />
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">During the event</p>
        </div>
        <div className="flex flex-col gap-3">
          {duringQuestions.map(({ key, label, reversed }) => (
            <div key={key}>
              <QuestionChart label={label} counts={distributions[key]} total={regs.length} />
              {reversed && (
                <p className="text-xs text-text-muted mt-1 ml-1">* Lower score = less overwhelmed = better</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mood breakdown */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Mood after event</p>
        <div className="grid grid-cols-4 gap-3">
          {MOODS.map(({ key, emoji, label }) => {
            const count = moodCounts[key] ?? 0;
            const pct   = regs.length > 0 ? Math.round((count / regs.length) * 100) : 0;
            return (
              <div key={key} className="bg-surface border border-border rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="font-heading text-lg font-bold text-text-primary">{count}</div>
                <div className="text-xs text-text-muted">{label}</div>
                <div className="text-xs text-accent-highlight mt-0.5">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Insights & suggestions</p>
          <div className="flex flex-col gap-2">
            {insights.map((i, idx) => (
              <div key={idx} className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-accent-highlight mb-1">{i.name}</p>
                <p className="text-sm text-text-secondary leading-relaxed">{i.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}