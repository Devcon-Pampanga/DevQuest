"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getXpLevelProgress, XP_LEVEL_STEP } from "@/lib/xpLevel";
import { TEAM_META } from "@/lib/seed/quests";
import { profileDisplayName } from "@/lib/profileDisplayName";
import type { ProfilePageUser } from "@/components/profile/types";

function HeaderLinkedInIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect width="16" height="16" rx="3" fill="#0A66C2" />
      <rect x="3" y="6" width="2.5" height="7" fill="white" />
      <circle cx="4.25" cy="3.75" r="1.5" fill="white" />
      <path d="M7.5 6h2.3v1h.05C10.2 6.4 11 6 12 6c2 0 2.5 1.3 2.5 3v4h-2.5v-3.5c0-.8-.3-1.5-1-1.5s-1.2.7-1.2 1.5V13H7.5V6z" fill="white" />
    </svg>
  );
}

function HeaderGitHubIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
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

export function ProfileHeaderCard({
  userData,
  avatarUrl,
  onGenerateResume,
  isGeneratingResume,
  onCopyShare,
  copied,
}: {
  userData: ProfilePageUser;
  avatarUrl: string;
  onGenerateResume: () => void | Promise<void>;
  isGeneratingResume: boolean;
  onCopyShare: () => void;
  copied: boolean;
}) {
  const teams = userData.teams ?? [];
  const email = userData.email?.trim();
  const hasSocialLinks = Boolean(userData.linkedinUrl || userData.githubUrl);
  const primaryTeamId = teams[0] ?? null;
  const teamColor = primaryTeamId && TEAM_META[primaryTeamId] ? TEAM_META[primaryTeamId].color : "#A855F7";
  const xpProgress = getXpLevelProgress(userData.xp ?? 0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!mobileMenuRef.current?.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 45%, #A855F7 80%, #C084FC 100%)" }}
    >
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="p-5 relative z-10 flex flex-col gap-4">
        {/* Top-right icon actions */}
        <div className="absolute top-4 right-4 z-20 hidden sm:flex gap-2">
          <button
            type="button"
            title={copied ? "Copied!" : "Share profile"}
            onClick={onCopyShare}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors border border-white/20 backdrop-blur-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
          <button
            type="button"
            title={isGeneratingResume ? "Generating…" : "Generate resume"}
            onClick={() => void onGenerateResume()}
            disabled={isGeneratingResume}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors border border-white/20 backdrop-blur-sm disabled:opacity-60 disabled:cursor-wait"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <Link
            href="/settings"
            title="Settings"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors border border-white/20 backdrop-blur-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>

        <div ref={mobileMenuRef} className="absolute top-4 right-4 z-20 sm:hidden">
          <button
            type="button"
            title="More actions"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors border border-white/20 backdrop-blur-sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {mobileMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/15 bg-[#140f20]/95 p-2 shadow-2xl backdrop-blur-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onCopyShare();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-heading text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {copied ? "Copied!" : "Share profile"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void onGenerateResume();
                  setMobileMenuOpen(false);
                }}
                disabled={isGeneratingResume}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-heading text-white/85 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-60"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isGeneratingResume ? "Generating..." : "Generate resume"}
              </button>
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-heading text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </Link>
            </div>
          ) : null}
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4 min-w-0 pr-16 sm:pr-32">
          <div
            className="relative shrink-0 size-[4.5rem] sm:size-20 rounded-xl overflow-hidden border-2"
            style={{ backgroundColor: "#100c1a", borderColor: teamColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="" width={80} height={80} className="block h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex flex-col justify-center gap-1 flex-1 leading-none">
            <h2 className="font-heading text-xl sm:text-2xl text-white leading-tight truncate">
              {profileDisplayName(userData.username)}
            </h2>
            <p className="text-sm text-white/70 font-sans truncate leading-snug mt-0.5">
              {userData.chapterId} &bull; {userData.role === "coordinator" ? "Coordinator" : "Volunteer"}
            </p>
            {email ? (
              <a
                href={`mailto:${encodeURIComponent(email)}`}
                className="text-xs text-white/50 font-sans truncate hover:text-white/80 transition-colors mt-0.5"
              >
                {email}
              </a>
            ) : null}
          </div>
        </div>

        {/* XP / Level bar */}
        <div className="pt-4 border-t border-white/15">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] text-white/60 font-sans uppercase tracking-widest">Level</p>
              <p className="font-heading text-2xl tabular-nums leading-none text-white mt-0.5">
                {xpProgress.level}
              </p>
            </div>
            <div className="text-right min-w-0">
              <p className="text-[10px] text-white/60 font-sans uppercase tracking-widest">Total XP</p>
              <p className="font-heading text-xl tabular-nums leading-none text-white mt-0.5 whitespace-nowrap">
                {(userData.xp ?? 0).toLocaleString()}{" "}
                <span className="text-sm text-white/60 font-sans">xp</span>
              </p>
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${xpProgress.pctToNextLevel}%`, backgroundColor: teamColor }}
            />
          </div>
          <p className="text-[10px] text-white/40 font-sans tabular-nums mt-1 text-right">
            {xpProgress.xpIntoLevel.toLocaleString()} / {XP_LEVEL_STEP.toLocaleString()} to next level
          </p>
        </div>

        {/* Social links */}
        {hasSocialLinks ? (
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {userData.linkedinUrl ? (
              <a
                href={userData.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-sans text-white/55 hover:text-white transition-colors min-w-0"
              >
                <HeaderLinkedInIcon />
                <span className="truncate">{userData.linkedinUrl.replace(/^https?:\/\//, "")}</span>
              </a>
            ) : null}
            {userData.githubUrl ? (
              <a
                href={userData.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-sans text-white/55 hover:text-white transition-colors min-w-0"
              >
                <HeaderGitHubIcon />
                <span className="truncate">{userData.githubUrl.replace(/^https?:\/\//, "")}</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
