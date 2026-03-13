"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { completeOnboarding } from "@/lib/auth-helpers";

// ─── Constants ───────────────────────────────────────────────────────────────

const TEAMS = [
  { id: "lead_learners",        name: "Lead Learners",        color: "#F5C518" },
  { id: "people_culture",       name: "People & Culture",     color: "#F97316" },
  { id: "community_engagement", name: "Community Engagement", color: "#22C55E" },
  { id: "creatives",            name: "Creatives",            color: "#9333EA" },
  { id: "sustainability",       name: "Sustainability",        color: "#06B6D4" },
] as const;

const CHAPTERS = [
  "DEVCON Kids Baguio",
  "DEVCON Kids Cagayan de Oro",
  "DEVCON Kids Cebu",
  "DEVCON Kids Davao",
  "DEVCON Kids Iloilo",
  "DEVCON Kids Manila",
  "DEVCON Kids Pampanga",
  "DEVCON Kids Quezon City",
  "DEVCON Kids Tacloban",
  "DEVCON Kids Zamboanga",
] as const;

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect width="16" height="16" rx="3" fill="#0A66C2" />
      <rect x="3" y="6" width="2.5" height="7" fill="white" />
      <circle cx="4.25" cy="3.75" r="1.5" fill="white" />
      <path d="M7.5 6h2.3v1h.05C10.2 6.4 11 6 12 6c2 0 2.5 1.3 2.5 3v4h-2.5v-3.5c0-.8-.3-1.5-1-1.5s-1.2.7-1.2 1.5V13H7.5V6z" fill="white" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688
               0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125
               a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554
               C21.965 6.012 17.461 2 12 2z" />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 014 13c0-5 3-9 7-9 4 0 8 4 8 9a7 7 0 01-7 7z" />
      <path d="M11 20v-9" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const TEAM_ICONS: Record<string, () => React.JSX.Element> = {
  lead_learners:        BookIcon,
  people_culture:       UsersIcon,
  community_engagement: GlobeIcon,
  creatives:            PaletteIcon,
  sustainability:       LeafIcon,
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // Auth guard
  const [authChecked, setAuthChecked] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  // Form fields
  const [username, setUsername]           = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [linkedinUrl, setLinkedinUrl]     = useState("");
  const [githubUrl, setGithubUrl]         = useState("");
  const [chapterId, setChapterId]         = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // UI state
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.data()?.onboardingComplete === true) {
        router.replace("/dashboard");
        return;
      }
      setUid(user.uid);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  // Blank screen while checking auth — prevents flash of form
  if (!authChecked) return null;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function toggleTeam(teamId: string) {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((t) => t !== teamId) : [...prev, teamId]
    );
  }

  const CONTACT_PREFIX = "+63 ";
  function formatContactNumber(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) return CONTACT_PREFIX;
    const after63 = digits.startsWith("63") ? digits.slice(2) : digits;
    return CONTACT_PREFIX + after63.replace(/(\d{3})(?=\d)/g, "$1 ");
  }

  function validate(): string {
    const u = username.trim();
    if (!u) return "Full name is required.";
    if (u.length < 3) return "Full name must be at least 3 characters.";
    if (!contactNumber.trim()) return "Contact number is required.";
    if (!chapterId) return "Please select your chapter.";
    if (selectedTeams.length === 0) return "Please select at least one team.";
    return "";
  }

  async function handleSubmit() {
    setError("");
    const validErr = validate();
    if (validErr) { setError(validErr); return; }
    if (!uid) return;

    setLoading(true);
    try {
      await completeOnboarding({
        uid,
        username:      username.trim(),
        contactNumber: contactNumber.replace(/\s/g, "").trim(),
        linkedinUrl:   linkedinUrl.trim(),
        githubUrl:     githubUrl.trim(),
        chapterId,
        teams: selectedTeams,
      });
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(
        (err as Error).message === "USERNAME_TAKEN"
          ? "A profile with this name already exists."
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Shared class strings ────────────────────────────────────────────────────
  const labelCls =
    "block text-[11px] font-sans uppercase tracking-widest text-text-secondary mb-2";
  const inputCls =
    "w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary text-sm font-sans placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-highlight transition-shadow";

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

        {/* Heading */}
        <h1 className="font-heading text-3xl text-text-primary mb-2">
          Complete Your Profile
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          Enter your details to finish setting up your DevQuest account.
        </p>

        {/* Full Name */}
        <div className="mb-4">
          <label className={labelCls}>Full Name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Juan Dela Cruz"
            className={inputCls}
          />
        </div>

        {/* Contact Number */}
        <div className="mb-4">
          <label className={labelCls}>Contact Number</label>
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(formatContactNumber(e.target.value))}
            onFocus={() => {
              if (!contactNumber.startsWith("+63")) {
                setContactNumber(contactNumber.trim() ? formatContactNumber(contactNumber) : CONTACT_PREFIX);
              }
            }}
            placeholder="+63 900 000 0000"
            className={inputCls}
          />
        </div>

        {/* LinkedIn URL */}
        <div className="mb-4">
          <label className={labelCls}>
            LinkedIn URL{" "}
            <span className="normal-case tracking-normal text-text-muted">(optional)</span>
          </label>
          <div className="flex rounded-lg overflow-hidden border border-border focus-within:ring-2 focus-within:ring-accent-highlight transition-shadow">
            <div className="w-1 bg-[#0A66C2] flex-shrink-0" />
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <LinkedInIcon />
              </div>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/yourname"
                className="w-full bg-surface pl-10 pr-4 py-3 text-text-primary text-sm font-sans placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* GitHub URL */}
        <div className="mb-4">
          <label className={labelCls}>
            GitHub URL{" "}
            <span className="normal-case tracking-normal text-text-muted">(optional)</span>
          </label>
          <div className="flex rounded-lg overflow-hidden border border-border focus-within:ring-2 focus-within:ring-[#341539] transition-shadow">
            <div className="w-1 bg-[#341539] flex-shrink-0" />
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <GitHubIcon />
              </div>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="github.com/yourusername"
                className="w-full bg-surface pl-10 pr-4 py-3 text-text-primary text-sm font-sans placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* DEVCON Kids Chapter */}
        <div className="mb-6">
          <label className={labelCls}>DEVCON Kids Chapter</label>
          <div className="relative">
            <select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 pr-10 text-text-primary text-sm font-sans appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-highlight transition-shadow"
            >
              <option value="" disabled className="bg-[#1a1a2e]">
                Select your chapter
              </option>
              {CHAPTERS.map((c) => (
                <option key={c} value={c} className="bg-[#1a1a2e]">
                  {c}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
              <ChevronDownIcon />
            </div>
          </div>
        </div>

        {/* Volunteer Teams */}
        <div className="mb-6">
          <label className={labelCls}>Volunteer Team(s)</label>
          <div className="flex flex-wrap gap-2">
            {TEAMS.map((team) => {
              const isSelected = selectedTeams.includes(team.id);
              const Icon = TEAM_ICONS[team.id];
              return (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className={
                    isSelected
                      ? "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans border-2 transition-all"
                      : "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans border border-border bg-surface text-text-secondary hover:border-text-muted transition-all"
                  }
                  style={
                    isSelected
                      ? {
                          borderColor: team.color,
                          backgroundColor: `${team.color}18`,
                          color: team.color,
                        }
                      : undefined
                  }
                >
                  {Icon && <Icon />}
                  {team.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-accent-highlight hover:bg-accent-primary text-white font-heading text-sm tracking-widest uppercase py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving…" : "Let's Go"}
        </button>

        {/* Team Color Dots */}
        <div className="flex justify-center gap-2 mt-10">
          {TEAMS.map((team) => (
            <div
              key={team.id}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: team.color }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
