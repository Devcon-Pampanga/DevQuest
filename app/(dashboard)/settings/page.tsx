"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, deleteUser, User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageShell, { SkeletonBlock } from "@/components/layout/PageShell";
import { TEAM_META } from "@/lib/seed/quests";

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
  email?: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  teams: string[];
  xp: number;
  contactNumber: string;
  linkedinUrl?: string;
  githubUrl?: string;
  avatarOptions?: AvatarOptions;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR: AvatarOptions = {
  backgroundColor: "5e35b1",
  backgroundType: "solid",
  eyes: "round",
  mouth: "smile01",
};

const ALL_TEAM_IDS = Object.keys(TEAM_META);

const BG_COLORS: { hex: string; label: string }[] = [
  { hex: "transparent", label: "None" },
  { hex: "ffb300", label: "Amber" },
  { hex: "fdd835", label: "Yellow" },
  { hex: "43a047", label: "Green" },
  { hex: "00acc1", label: "Teal" },
  { hex: "039be5", label: "Blue" },
  { hex: "1e88e5", label: "Indigo" },
  { hex: "5e35b1", label: "Purple" },
  { hex: "8e24aa", label: "Violet" },
  { hex: "d81b60", label: "Pink" },
  { hex: "e53935", label: "Red" },
  { hex: "f4511e", label: "Orange" },
  { hex: "00897b", label: "Mint" },
];

const EYES_OPTIONS: { id: string; label: string }[] = [
  { id: "bulging", label: "Bulging" },
  { id: "dizzy", label: "Dizzy" },
  { id: "eva", label: "Eva" },
  { id: "frame1", label: "Frame 1" },
  { id: "frame2", label: "Frame 2" },
  { id: "glow", label: "Glow" },
  { id: "happy", label: "Happy" },
  { id: "hearts", label: "Hearts" },
  { id: "robocop", label: "Robocop" },
  { id: "round", label: "Round" },
  { id: "roundFrame01", label: "Round Frame 1" },
  { id: "roundFrame02", label: "Round Frame 2" },
  { id: "sensor", label: "Sensor" },
  { id: "shade01", label: "Shade" },
];

const MOUTH_OPTIONS: { id: string; label: string }[] = [
  { id: "bite", label: "Bite" },
  { id: "diagram", label: "Diagram" },
  { id: "grill01", label: "Grill 1" },
  { id: "grill02", label: "Grill 2" },
  { id: "grill03", label: "Grill 3" },
  { id: "smile01", label: "Smile 1" },
  { id: "smile02", label: "Smile 2" },
  { id: "square01", label: "Square 1" },
  { id: "square02", label: "Square 2" },
];

function buildAvatarUrl(seed: string, opts: AvatarOptions): string {
  const p: Record<string, string> = {
    seed,
    eyes: opts.eyes,
    mouth: opts.mouth,
    backgroundColor: opts.backgroundColor === "transparent" ? "" : opts.backgroundColor,
    backgroundType: opts.backgroundType,
  };
  const qs = Object.entries(p)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?${qs}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:items-start pb-10">
        <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-2">
          <SkeletonBlock className="h-64" />
          <SkeletonBlock className="h-32" />
        </div>
        <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-1">
          <SkeletonBlock className="h-52" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Profile fields
  const [username, setUsername] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  // Avatar editor
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [draftOptions, setDraftOptions] = useState<AvatarOptions>(DEFAULT_AVATAR);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [teamLoading, setTeamLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data()?.onboardingComplete !== true) {
        router.replace("/onboarding");
        return;
      }
      const data = { uid: user.uid, ...snap.data() } as UserData;
      setFirebaseUser(user);
      setUserData(data);
      setUsername(data.username ?? "");
      setContactNumber(data.contactNumber ?? "");
      setLinkedinUrl(data.linkedinUrl ?? "");
      setGithubUrl(data.githubUrl ?? "");
      setAuthChecked(true);
      setDataLoading(false);
    });
    return () => unsub();
  }, [router]);

  function openAvatarEditor() {
    if (!userData) return;
    setDraftOptions(userData.avatarOptions ?? DEFAULT_AVATAR);
    setShowAvatarEditor(true);
  }

  async function handleSaveAvatar() {
    if (!firebaseUser) return;
    setSavingAvatar(true);
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        avatarOptions: draftOptions,
      });
      setUserData((prev) => (prev ? { ...prev, avatarOptions: draftOptions } : prev));
      setShowAvatarEditor(false);
    } catch {
      // silently fail — user can retry
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    if (!userData || !firebaseUser) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const trimmedUsername = username.trim().toLowerCase();
      const updates: Record<string, string> = {
        username: trimmedUsername,
        contactNumber: contactNumber.trim(),
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
      };
      await updateDoc(doc(db, "users", firebaseUser.uid), updates);
      setUserData((prev) => prev ? { ...prev, ...updates } : prev);
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLeaveTeam(teamId: string) {
    if (!userData || !firebaseUser) return;
    if ((userData.teams ?? []).length <= 1) return; // must keep at least 1
    setTeamLoading(teamId);
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        teams: arrayRemove(teamId),
      });
      setUserData((prev) =>
        prev ? { ...prev, teams: prev.teams.filter((t) => t !== teamId) } : prev
      );
    } catch {
      // silently fail — user can retry
    } finally {
      setTeamLoading(null);
    }
  }

  async function handleJoinTeam(teamId: string) {
    if (!userData || !firebaseUser) return;
    setTeamLoading(teamId);
    try {
      await Promise.all([
        updateDoc(doc(db, "users", firebaseUser.uid), {
          teams: arrayUnion(teamId),
        }),
        setDoc(
          doc(db, "users", firebaseUser.uid, "teamProgress", teamId),
          { teamId, currentTier: "team_member" },
          { merge: true }
        ),
      ]);
      setUserData((prev) =>
        prev ? { ...prev, teams: [...prev.teams, teamId] } : prev
      );
    } catch {
      // silently fail — user can retry
    } finally {
      setTeamLoading(null);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await signOut(auth);
      router.replace("/");
    } catch {
      setLogoutLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!firebaseUser) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteDoc(doc(db, "users", firebaseUser.uid));
      await deleteUser(firebaseUser);
      router.replace("/");
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "";
      setDeleteError(
        msg.includes("requires-recent-login")
          ? "Please sign out and sign back in before deleting your account."
          : "Failed to delete account. Please try again."
      );
      setDeleteLoading(false);
      setConfirmDelete(false);
    }
  }

  // Early return while auth/data loads
  if (!authChecked || !userData) {
    return (
      <PageShell title="Settings" backHref="/profile" loading skeleton={<SettingsSkeleton />}>
        {null}
      </PageShell>
    );
  }

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);
  const currentTeams = userData.teams ?? [];

  return (
    <PageShell
      title="Settings"
      avatarUrl={avatarUrl}
      backHref="/profile"
      loading={dataLoading}
      skeleton={<SettingsSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:items-start pb-10">

          {/* Left column: Profile Info + Account */}
          <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-2">

            {/* ── Profile info (with avatar) ── */}
            <section className="order-1 lg:order-none rounded-2xl border border-border bg-surface overflow-hidden animate-fade-up" style={{ animationDelay: "0ms" }}>
              <div className="px-5 py-3 border-b border-border">
                <span className="font-heading text-sm text-text-primary">Profile Info</span>
              </div>
              <div className="px-5 py-5 flex flex-col gap-4">
                {/* Avatar row */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={openAvatarEditor}
                      className="w-16 h-16 rounded-xl overflow-hidden border border-border block focus:outline-none focus:ring-2 focus:ring-accent-highlight"
                      style={{ backgroundColor: "#100c1a" }}
                      aria-label="Edit avatar"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl} alt="" width={64} height={64} className="w-full h-full object-contain" />
                    </button>
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-border pointer-events-none"
                      style={{ backgroundColor: "#1a1625", color: "#A1A1AA" }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-sans text-text-primary">Your avatar</p>
                    <button
                      type="button"
                      onClick={openAvatarEditor}
                      className="text-xs font-sans text-accent-highlight hover:text-accent-primary transition-colors text-left"
                    >
                      Change Avatar →
                    </button>
                  </div>
                </div>

                <div className="border-t border-border" />

                <Field label="Username">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#0f0f18] border border-border rounded-lg px-3 py-2.5 text-sm font-sans text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-highlight transition-colors"
                    placeholder="your username"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Mobile number">
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-[#0f0f18] border border-border rounded-lg px-3 py-2.5 text-sm font-sans text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-highlight transition-colors"
                    placeholder="+63 9XX XXX XXXX"
                  />
                </Field>
                <Field label="LinkedIn URL">
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full bg-[#0f0f18] border border-border rounded-lg px-3 py-2.5 text-sm font-sans text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-highlight transition-colors"
                    placeholder="https://linkedin.com/in/..."
                  />
                </Field>
                <Field label="GitHub URL">
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full bg-[#0f0f18] border border-border rounded-lg px-3 py-2.5 text-sm font-sans text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-highlight transition-colors"
                    placeholder="https://github.com/..."
                  />
                </Field>

                {saveError ? (
                  <p className="text-xs text-red-400 font-sans animate-fade-in">{saveError}</p>
                ) : null}
                {saveSuccess ? (
                  <p className="text-xs text-green-400 font-sans animate-fade-in">Changes saved.</p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleSaveProfile()}
                  disabled={saving}
                  className="w-full py-2.5 px-4 rounded-xl font-heading text-sm tracking-wide bg-accent-highlight hover:bg-accent-primary text-white transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </section>

            {/* ── Account ── */}
            <section className="order-3 lg:order-none rounded-2xl border border-border bg-surface overflow-hidden animate-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="px-5 py-3 border-b border-border">
                <span className="font-heading text-sm text-text-primary">Account</span>
              </div>
              <div className="px-5 py-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={logoutLoading || deleteLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-heading text-sm tracking-wide border border-border text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  {logoutLoading ? "Signing out…" : "Log Out"}
                </button>

                <div className="pt-2 border-t border-border">
                  <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4">
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => { setConfirmDelete(true); setDeleteError(""); }}
                        disabled={logoutLoading || deleteLoading}
                        className="w-full py-2.5 px-4 rounded-xl font-sans text-sm border border-red-800/60 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                      >
                        Delete Account
                      </button>
                    ) : (
                      <div className="animate-fade-in">
                        <p className="text-text-secondary text-xs text-center leading-relaxed mb-1">
                          This will permanently delete your account and all associated data.
                        </p>
                        <p className="text-red-400/80 text-xs text-center mb-4">This cannot be undone.</p>
                        {deleteError ? (
                          <p className="text-xs text-red-400 font-sans text-center mb-3">{deleteError}</p>
                        ) : null}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            disabled={deleteLoading}
                            className="flex-1 border border-border text-text-muted hover:text-text-primary font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteAccount()}
                            disabled={deleteLoading}
                            className="flex-1 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deleteLoading ? "Deleting…" : "Yes, Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Right column: Volunteer Teams */}
          <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-1">

            {/* ── Volunteer teams ── */}
            <section className="order-2 lg:order-none rounded-2xl border border-border bg-surface overflow-hidden animate-fade-up" style={{ animationDelay: "60ms" }}>
              <div className="px-5 py-3 border-b border-border">
                <span className="font-heading text-sm text-text-primary">Volunteer Teams</span>
              </div>
              <div className="px-5 py-5 flex flex-col gap-3">
                <p className="text-xs text-text-muted font-sans">
                  You must be on at least one team. Leaving a team preserves your quest progress if you rejoin later.
                </p>
                {ALL_TEAM_IDS.map((teamId) => {
                  const meta = TEAM_META[teamId];
                  const isMember = currentTeams.includes(teamId);
                  const isOnly = isMember && currentTeams.length === 1;
                  const isLoading = teamLoading === teamId;
                  return (
                    <div
                      key={teamId}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3"
                      style={isMember ? { borderColor: `${meta.color}44`, backgroundColor: `${meta.color}0a` } : undefined}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-sans text-text-primary truncate">{meta.label}</p>
                          {isMember ? (
                            <p className="text-[10px] font-sans text-text-muted mt-0.5">Member</p>
                          ) : null}
                        </div>
                      </div>
                      {isMember ? (
                        <button
                          type="button"
                          onClick={() => void handleLeaveTeam(teamId)}
                          disabled={isOnly || isLoading}
                          className="shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs font-sans text-text-muted hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={isOnly ? "You must remain on at least one team" : undefined}
                        >
                          {isLoading ? "Leaving…" : "Leave"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleJoinTeam(teamId)}
                          disabled={isLoading}
                          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-sans transition-colors disabled:opacity-50"
                          style={{
                            borderWidth: 1,
                            borderStyle: "solid",
                            borderColor: `${meta.color}55`,
                            backgroundColor: `${meta.color}14`,
                            color: meta.color,
                          }}
                        >
                          {isLoading ? "Joining…" : "Join"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

          </div>

        </div>
      </div>

      {/* ── Avatar editor modal ── */}
      {showAvatarEditor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !savingAvatar && setShowAvatarEditor(false)} role="presentation" style={{ animation: "fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both" }} />
          <div
            className="relative border border-border rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl"
            style={{ backgroundColor: "#1a1625", animation: "modal-in 350ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-heading text-[1rem] text-white">Customize Avatar</h2>
              <button
                type="button"
                onClick={() => !savingAvatar && setShowAvatarEditor(false)}
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
                  <img src={buildAvatarUrl(userData.username, draftOptions)} alt="" width={96} height={96} className="w-full h-full" />
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
                    <OptionChip
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
                    <OptionChip
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
                    <OptionChip
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
                onClick={() => setShowAvatarEditor(false)}
                disabled={savingAvatar}
                className="flex-1 border border-border text-text-muted hover:text-text-primary font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAvatar()}
                disabled={savingAvatar}
                className="flex-1 bg-accent-highlight hover:bg-accent-primary text-white font-heading text-xs tracking-widest uppercase py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingAvatar ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-sans uppercase tracking-widest text-text-muted">{label}</label>
      {children}
    </div>
  );
}

// ─── OptionChip ────────────────────────────────────────────────────────────────

function OptionChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
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
