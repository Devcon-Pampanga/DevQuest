"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, deleteUser, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ─── Team config ──────────────────────────────────────────────────────────────

const TEAMS = [
  { id: "lead_learners",        name: "Lead Learners",        color: "#F5C518" },
  { id: "people_culture",       name: "People & Culture",     color: "#F97316" },
  { id: "community_engagement", name: "Community Engagement", color: "#22C55E" },
  { id: "creatives",            name: "Creatives",            color: "#9333EA" },
  { id: "sustainability",       name: "Sustainability",       color: "#06B6D4" },
];

const TEAM_MAP: Record<string, { name: string; color: string }> = Object.fromEntries(
  TEAMS.map((t) => [t.id, { name: t.name, color: t.color }])
);

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

function LinkedInIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect width="16" height="16" rx="3" fill="#0A66C2" />
      <rect x="3" y="6" width="2.5" height="7" fill="white" />
      <circle cx="4.25" cy="3.75" r="1.5" fill="white" />
      <path d="M7.5 6h2.3v1h.05C10.2 6.4 11 6 12 6c2 0 2.5 1.3 2.5 3v4h-2.5v-3.5c0-.8-.3-1.5-1-1.5s-1.2.7-1.2 1.5V13H7.5V6z" fill="white" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#341539" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8c0 2.9 1.88 5.36 4.48 6.23.33.06.45-.14.45-.31
           0-.16-.01-.67-.01-1.22-1.65.3-2.08-.4-2.21-.77-.07-.19-.4-.77-.67-.93
           -.23-.12-.56-.42-.01-.43.52-.01.89.48 1.01.67.59.99 1.54.71 1.92.54
           .06-.42.23-.71.42-.88-1.46-.17-2.99-.73-2.99-3.24 0-.71.25-1.3.67-1.76
           -.07-.17-.3-.83.07-1.74 0 0 .55-.17 1.8.67.52-.14 1.08-.22 1.64-.22
           .56 0 1.12.08 1.64.22 1.25-.85 1.8-.67 1.8-.67.37.9.14 1.57.07 1.74
           .42.46.67 1.04.67 1.76 0 2.52-1.54 3.07-3 3.24.24.2.44.6.44 1.21
           0 .87-.01 1.58-.01 1.8 0 .17.12.38.45.31C12.62 13.36 14.5 10.9 14.5 8
           14.5 4.41 11.59 1.5 8 1.5z"
        fill="white"
      />
    </svg>
  );
}

function XPIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

// ─── Data Types ───────────────────────────────────────────────────────────────

interface UserData {
  username: string;
  email: string;
  role: "volunteer" | "coordinator";
  contactNumber: string;
  chapterId: string;
  teams: string[];
  xp: number;
  linkedinUrl?: string;
  githubUrl?: string;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked]     = useState(false);
  const [firebaseUser, setFirebaseUser]   = useState<FirebaseUser | null>(null);
  const [userData, setUserData]           = useState<UserData | null>(null);

  const [loading, setLoading]             = useState(false);
  const [loadingAction, setLoadingAction] = useState<"logout" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]                 = useState("");

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data()?.onboardingComplete !== true) {
        router.replace("/onboarding");
        return;
      }
      setFirebaseUser(user);
      setUserData(snap.data() as UserData);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  if (!authChecked || !userData) return null;

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function handleLogout() {
    setError("");
    setLoading(true);
    setLoadingAction("logout");
    try {
      await signOut(auth);
      router.replace("/");
    } catch {
      setError("Failed to sign out. Please try again.");
      setLoading(false);
      setLoadingAction(null);
    }
  }

  async function handleDeleteAccount() {
    if (!firebaseUser) return;
    setError("");
    setLoading(true);
    setLoadingAction("delete");
    try {
      await deleteDoc(doc(db, "users", firebaseUser.uid));
      await deleteUser(firebaseUser);
      router.replace("/");
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "";
      if (msg.includes("requires-recent-login")) {
        setError("For security, please sign out and sign in again before deleting your account.");
      } else {
        setError("Failed to delete account. Please try again.");
      }
      setLoading(false);
      setLoadingAction(null);
      setConfirmDelete(false);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function displayName(raw: string) {
    return raw
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-14"
      style={{
        background:
          "radial-gradient(ellipse 100% 60% at 30% 20%, rgba(124,58,237,0.22) 0%, transparent 60%)",
        backgroundColor: "#0a0a0f",
      }}
    >
      <div className="w-full max-w-sm">

        {/* Eyebrow + name */}
        <div className="mb-7">
          <p className="text-[11px] font-sans uppercase tracking-widest text-accent-highlight mb-2">
            Temporary Placeholder · Home
          </p>
          <h1 className="font-heading text-3xl text-text-primary leading-tight mb-1">
            {displayName(userData.username)}
          </h1>
          <p className="text-text-secondary text-sm font-sans">{userData.email}</p>
        </div>

        {/* ── Profile card ──────────────────────────────────────────────────── */}
        <div
          className="border border-border rounded-2xl overflow-hidden mb-4"
          style={{ backgroundColor: "#100c1a" }}
        >

          {/* Role strip */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[11px] font-sans uppercase tracking-widest text-text-muted">
              Account
            </span>
            <span
              className="text-[10px] font-sans uppercase tracking-widest px-2.5 py-1 rounded-full border"
              style={
                userData.role === "coordinator"
                  ? { borderColor: "#A855F755", backgroundColor: "#A855F714", color: "#A855F7" }
                  : { borderColor: "#27272A",   backgroundColor: "#ffffff08",  color: "#71717A" }
              }
            >
              {userData.role}
            </span>
          </div>

          <div className="px-5 py-5 space-y-5">

            {/* XP */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-1">
                  Total XP
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-2xl" style={{ color: "#A855F7" }}>
                    {userData.xp.toLocaleString()}
                  </span>
                  <span className="text-xs text-text-muted font-sans">xp</span>
                </div>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                style={{ backgroundColor: "#A855F714", color: "#A855F7" }}
              >
                <XPIcon />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Chapter */}
            <div>
              <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-1">
                Chapter
              </p>
              <p className="text-text-primary text-sm font-sans">{userData.chapterId}</p>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-1">
                Contact
              </p>
              <p className="text-text-primary text-sm font-sans">{userData.contactNumber}</p>
            </div>

            {/* Teams */}
            {userData.teams.length > 0 && (
              <div>
                <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-2">
                  Teams
                </p>
                <div className="flex flex-wrap gap-2">
                  {userData.teams.map((teamId) => {
                    const team = TEAM_MAP[teamId];
                    if (!team) return null;
                    return (
                      <span
                        key={teamId}
                        className="px-3 py-1.5 rounded-lg text-xs font-sans border"
                        style={{
                          borderColor: `${team.color}66`,
                          backgroundColor: `${team.color}14`,
                          color: team.color,
                        }}
                      >
                        {team.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Links */}
            {(userData.linkedinUrl || userData.githubUrl) && (
              <div>
                <p className="text-[11px] font-sans uppercase tracking-widest text-text-muted mb-2">
                  Links
                </p>
                <div className="flex flex-col gap-2">
                  {userData.linkedinUrl && (
                    <a
                      href={userData.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-text-primary transition-colors group"
                    >
                      <LinkedInIcon />
                      <span className="truncate group-hover:text-accent-highlight transition-colors">
                        {userData.linkedinUrl.replace(/^https?:\/\//, "")}
                      </span>
                    </a>
                  )}
                  {userData.githubUrl && (
                    <a
                      href={userData.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-text-primary transition-colors group"
                    >
                      <GitHubIcon />
                      <span className="truncate group-hover:text-accent-highlight transition-colors">
                        {userData.githubUrl.replace(/^https?:\/\//, "")}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        {/* ── Action buttons ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">

          {/* Log Out */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full bg-accent-highlight hover:bg-accent-primary text-white font-heading text-sm tracking-widest uppercase py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingAction === "logout" ? "Signing out…" : "Log Out"}
          </button>

          {/* Delete Account — two-step */}
          {!confirmDelete ? (
            <button
              onClick={() => { setConfirmDelete(true); setError(""); }}
              disabled={loading}
              className="w-full bg-transparent border border-border hover:border-red-500/40 text-text-muted hover:text-red-400 font-sans text-sm py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Account
            </button>
          ) : (
            <div
              className="rounded-xl border border-red-500/25 overflow-hidden"
              style={{ backgroundColor: "#1a0d0d" }}
            >
              <div className="px-4 pt-4 pb-3">
                <p className="text-text-secondary text-xs text-center leading-relaxed mb-4">
                  This will permanently delete your account and all associated data.
                  <span className="block text-red-400/80 mt-1">This cannot be undone.</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={loading}
                    className="flex-1 border border-border text-text-muted hover:text-text-primary font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#ff000010" }}
                  >
                    {loadingAction === "delete" ? "Deleting…" : "Yes, Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team color dots — wave on loading */}
        <div className="flex justify-center gap-2 mt-10">
          {TEAMS.map((team, i) => (
            <div
              key={team.id}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: team.color,
                ...(loading && {
                  animation: "wave-dot 0.6s ease-in-out infinite",
                  animationDelay: `${i * 0.1}s`,
                }),
              }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
