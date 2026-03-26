"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";
import { TIER_ORDER, TIER_LABELS, TEAM_META } from "@/lib/seed/quests";
import { Quest, QuestCompletion } from "@/types/quest";
import { getXpLevelProgress, XP_LEVEL_STEP } from "@/lib/xpLevel";


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
  resumeUrl?: string;
  createdAt?: Timestamp;
  avatarOptions?: AvatarOptions;
  onboardingComplete?: boolean;
}

type XPLogSource =
  | "event_attendance"
  | "quest_completion"
  | "reflection"
  | "profile_setup"
  | "tier_bonus";

interface XPLogEntry {
  logId?: string;
  source: XPLogSource | string;
  description: string;
  xp: number;
  createdAt?: Timestamp;
}

type TierLadderStatus = "completed" | "current" | "locked";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR: AvatarOptions = {
  backgroundColor: "5e35b1",
  backgroundType: "solid",
  eyes: "round",
  mouth: "smile01",
};

function buildAvatarUrl(seed: string, opts: AvatarOptions): string {
  const p: Record<string, string> = {
    seed,
    backgroundColor: opts.backgroundColor,
    backgroundType: opts.backgroundType,
    eyes: opts.eyes,
    mouth: opts.mouth,
  };
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?${new URLSearchParams(p)}`;
}

function formatDate(ts: Timestamp): string {
  return ts.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeTime(ts: Timestamp): string {
  const d = ts.toDate();
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const t = d.getTime();
  if (t >= startToday.getTime()) return "Today";
  if (t >= startYesterday.getTime()) return "Yesterday";
  const diffMs = startToday.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks <= 8) return `${weeks}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isTierUnlocked(
  teamId: string,
  tier: Quest["tier"],
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): boolean {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === 0) return true;
  const prevTier = TIER_ORDER[idx - 1];
  const prevQuests = allQuests.filter((q) => q.teamId === teamId && q.tier === prevTier);
  return prevQuests.every((q) => completions[q.questId]?.status === "completed");
}

function getCurrentTier(
  teamId: string,
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): Quest["tier"] {
  for (const tier of TIER_ORDER) {
    if (!isTierUnlocked(teamId, tier, completions, allQuests)) continue;
    const tierQuests = allQuests.filter((q) => q.teamId === teamId && q.tier === tier);
    const allDone = tierQuests.every((q) => completions[q.questId]?.status === "completed");
    if (!allDone) return tier;
  }
  return TIER_ORDER[TIER_ORDER.length - 1];
}

function getEarnedTier(
  teamId: string,
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): Quest["tier"] {
  let earned: Quest["tier"] = "team_member";
  for (const tier of TIER_ORDER) {
    const tierQs = allQuests.filter((q) => q.teamId === teamId && q.tier === tier);
    if (tierQs.every((q) => completions[q.questId]?.status === "completed")) {
      earned = tier;
    } else {
      break;
    }
  }
  return earned;
}

function questsForTier(teamId: string, tier: Quest["tier"], allQuests: Quest[]): Quest[] {
  return allQuests.filter((q) => q.teamId === teamId && q.tier === tier);
}

function getTierDate(
  teamId: string,
  tier: Quest["tier"],
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[],
  userCreatedAt: Timestamp | undefined
): Timestamp | null {
  if (tier === "team_member") return userCreatedAt ?? null;
  const qs = questsForTier(teamId, tier, allQuests);
  let max: Timestamp | null = null;
  for (const q of qs) {
    const c = completions[q.questId];
    if (c?.status !== "completed" || !c.completedAt) continue;
    if (!max || c.completedAt.toMillis() > max.toMillis()) max = c.completedAt;
  }
  return max;
}

function computeTierStatus(
  teamId: string,
  tier: Quest["tier"],
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): TierLadderStatus {
  if (tier === "team_member") return "completed";
  if (!isTierUnlocked(teamId, tier, completions, allQuests)) return "locked";
  const tierQuests = questsForTier(teamId, tier, allQuests);
  const allDone =
    tierQuests.length > 0 && tierQuests.every((q) => completions[q.questId]?.status === "completed");
  if (allDone) return "completed";
  const cur = getCurrentTier(teamId, completions, allQuests);
  if (tier === cur) return "current";
  return "locked";
}

function xpLogSourceIconColor(source: string): string {
  if (source === "event_attendance") return "#3B82F6";
  if (source === "quest_completion") return "#A855F7";
  if (source === "reflection") return "#FACC15";
  if (source === "profile_setup") return "#22C55E";
  if (source === "tier_bonus") return "#EAB308";
  return "#71717A";
}

// ─── Small icons ─────────────────────────────────────────────────────────────

function LockIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ─── Dashboard-style header icons (match dashboard/page.tsx) ────────────────

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

function HeaderXPIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function HeaderPencilIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function profileDisplayName(raw: string): string {
  return raw.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ─── Header Card ─────────────────────────────────────────────────────────────

function HeaderCard({
  userData,
  avatarUrl,
  onGenerateResume,
  isGeneratingResume,
  onCopyShare,
  copied,
}: {
  userData: UserData;
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

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 45%, #A855F7 80%, #C084FC 100%)" }}
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />
      {/* Glow orb */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="p-5 relative z-10 flex flex-col gap-4">
        {/* Desktop: share button top-right */}
        <div className="hidden sm:flex absolute top-5 right-5 z-20 gap-2">
          <button
            type="button"
            onClick={onCopyShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-heading uppercase tracking-wider transition-colors backdrop-blur-sm border border-white/20"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span key={copied ? "copied" : "share"}>
              {copied ? "Copied" : "Share"}
            </span>
          </button>
        </div>

        {/* Avatar + identity */}
        <div className="flex items-center gap-4 min-w-0 sm:pr-[8rem]">
          <div
            className="relative shrink-0 size-[4.5rem] sm:size-20 rounded-xl overflow-hidden border-2"
            style={{ backgroundColor: "#100c1a", borderColor: teamColor }}
          >
            <Link href="/dashboard" aria-label="Change avatar on Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="" width={80} height={80} className="block h-full w-full object-cover" />
            </Link>
            <div
              className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border border-white/20 pointer-events-none"
              style={{ backgroundColor: "#1a1625", color: "#A1A1AA" }}
            >
              <HeaderPencilIcon />
            </div>
          </div>
          <div className="min-w-0 flex flex-col justify-center gap-1 flex-1 leading-none">
            <h2 className="font-heading text-xl sm:text-2xl text-white leading-tight truncate">
              {profileDisplayName(userData.username)}
            </h2>
            <span className="inline-flex w-fit text-[10px] font-sans uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white leading-normal mt-0.5">
              {userData.role === "coordinator" ? "Coordinator" : "Volunteer"}
            </span>
            <p className="text-sm text-white/70 font-sans truncate leading-snug mt-0.5">
              {userData.chapterId}
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

        {/* XP + level strip */}
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

        {/* Teams */}
        {teams.length > 0 ? (
          <div className="pt-3 border-t border-white/15 flex flex-wrap gap-2">
            {teams.filter((tid) => TEAM_META[tid]).map((tid) => {
              const meta = TEAM_META[tid];
              return (
                <span
                  key={tid}
                  className="px-3 py-1.5 rounded-lg text-xs font-sans border"
                  style={{ borderColor: `${meta.color}66`, backgroundColor: `${meta.color}22`, color: meta.color }}
                >
                  {meta.label}
                </span>
              );
            })}
          </div>
        ) : null}

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

        {/* Mobile: share button */}
        <div className="flex sm:hidden">
          <button
            type="button"
            onClick={onCopyShare}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-heading uppercase tracking-wider transition-colors backdrop-blur-sm border border-white/20"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span key={copied ? "copied" : "share"}>{copied ? "Copied" : "Share Profile"}</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => void onGenerateResume()}
            disabled={isGeneratingResume}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-heading text-sm bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-colors disabled:opacity-60 disabled:cursor-wait backdrop-blur-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isGeneratingResume ? "Generating…" : "Generate Resume"}
          </button>
          <Link
            href="/settings"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-heading text-sm bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 transition-colors backdrop-blur-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Milestones ───────────────────────────────────────────────────────────────

function TierLadderRow({
  tier,
  status,
  teamColor,
  leadTitle,
  completedAt,
  completedCount,
  totalQuests,
  barsReady,
}: {
  tier: Quest["tier"];
  status: TierLadderStatus;
  teamColor: string;
  leadTitle: string;
  completedAt: Timestamp | null;
  completedCount: number;
  totalQuests: number;
  barsReady?: boolean;
}) {
  const label = tier === "lead" ? leadTitle : (TIER_LABELS[tier] ?? tier);

  return (
    <div
      className={`rounded-xl border p-4 flex gap-4 items-start ${
        status === "current" ? "bg-[#1a1a2e] border-[#27272A]" : "border-transparent bg-transparent"
      }`}
      style={status === "current" ? { borderLeftWidth: 3, borderLeftColor: teamColor } : undefined}
    >
      <div className="shrink-0 pt-0.5">
        {status === "locked" && (
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-zinc-500">
            <LockIcon className="w-4 h-4" />
          </div>
        )}
        {status === "completed" && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: teamColor }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {status === "current" && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-transparent animate-pulse"
            style={{
              boxShadow: `0 0 0 3px ${teamColor}`,
              backgroundColor: `${teamColor}22`,
            }}
          >
            <span className="text-xs font-heading font-bold tabular-nums" style={{ color: teamColor }}>
              {completedCount}/{totalQuests}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`font-heading font-semibold ${status === "locked" ? "text-zinc-500" : "text-text-primary"}`}
          >
            {label}
          </span>
          {status === "completed" && completedAt && (
            <span className="text-xs text-text-muted font-sans">{formatDate(completedAt)}</span>
          )}
        </div>
        {status === "current" && totalQuests > 0 && (
          <>
            <p className="text-sm text-text-secondary font-sans mt-1">
              {completedCount} / {totalQuests} quests complete
            </p>
            <div className="h-2 rounded-full bg-border mt-2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: "100%",
                  backgroundColor: teamColor,
                  transformOrigin: "left center",
                  transform: `scaleX(${barsReady ? (totalQuests ? completedCount / totalQuests : 0) : 0})`,
                  transition: barsReady ? "transform 700ms cubic-bezier(0.16, 1, 0.3, 1) 150ms" : "none",
                }}
              />
            </div>
          </>
        )}
        {status === "completed" && tier === "team_member" && (
          <p className="text-xs text-text-muted font-sans mt-1">Entry tier</p>
        )}
      </div>
    </div>
  );
}

function MilestonesSection({
  userData,
  completions,
  allQuests,
  activeTeam,
  onTeamChange,
}: {
  userData: UserData;
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
  activeTeam: string;
  onTeamChange: (id: string) => void;
}) {
  const teams = userData.teams ?? [];
  const meta = TEAM_META[activeTeam];
  const color = meta?.color ?? "#A855F7";
  const leadTitle = meta?.leadTitle ?? TIER_LABELS.lead;

  const [barsReady, setBarsReady] = useState(false);
  useEffect(() => {
    setBarsReady(false);
    const t = setTimeout(() => setBarsReady(true), 300);
    return () => clearTimeout(t);
  }, [activeTeam]);

  return (
    <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col gap-4">
      <h3 className="font-heading text-lg text-text-primary">Team milestones</h3>
      {teams.length >= 2 && (
        <div className="flex flex-wrap gap-2">
          {teams.map((tid) => {
            const m = TEAM_META[tid];
            const c = m?.color ?? "#A855F7";
            const active = activeTeam === tid;
            return (
              <button
                key={tid}
                type="button"
                onClick={() => onTeamChange(tid)}
                className="px-4 py-2 rounded-full text-sm font-heading font-semibold border transition-all"
                style={{
                  borderColor: active ? c : "#27272A",
                  backgroundColor: active ? `${c}1A` : "transparent",
                  color: active ? c : "#71717A",
                }}
              >
                {m?.label ?? tid}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {TIER_ORDER.map((tier) => {
          const createdAt = userData.createdAt;
          const status = computeTierStatus(activeTeam, tier, completions, allQuests);
          const tierQuests = questsForTier(activeTeam, tier, allQuests);
          const completedCount = tierQuests.filter((q) => completions[q.questId]?.status === "completed").length;
          const totalQuests = tierQuests.length;
          const date = getTierDate(activeTeam, tier, completions, allQuests, createdAt);
          return (
            <TierLadderRow
              key={tier}
              tier={tier}
              status={status}
              teamColor={color}
              leadTitle={leadTitle}
              completedAt={date}
              completedCount={completedCount}
              totalQuests={totalQuests}
              barsReady={barsReady}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed({
  entries,
  hasMore,
}: {
  entries: XPLogEntry[];
  hasMore: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-lg text-text-primary">Activity</h3>
        {hasMore ? (
          <button
            type="button"
            disabled
            title="Coming soon"
            className="text-xs font-heading text-text-muted cursor-not-allowed opacity-50"
          >
            View All
          </button>
        ) : null}
      </div>
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-text-muted gap-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center animate-float">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>
          <p className="font-heading text-text-secondary">No activity yet</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((e, i) => {
            const bg = xpLogSourceIconColor(e.source);
            const ts = e.createdAt;
            return (
              <li key={`${e.logId ?? ts?.toMillis?.() ?? i}-${i}`} className="flex gap-3 items-start" style={{ animation: `fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(i, 7) * 45}ms both` }}>
                <div
                  className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${bg}33` }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bg }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-sans leading-snug">{e.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-accent-highlight font-heading font-semibold">+{e.xp} XP</span>
                    {ts ? (
                      <span className="text-xs text-text-muted font-sans">{relativeTime(ts)}</span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Portfolio Card ───────────────────────────────────────────────────────────

function PortfolioCard({
  completions,
  allQuests,
  eventCount,
  reflectionCount,
  badgesEarned,
  onCopyShare,
  copied,
}: {
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
  eventCount: number;
  reflectionCount: number;
  badgesEarned: number;
  onCopyShare: () => void;
  copied: boolean;
}) {
  const verified = useMemo(() => {
    const rows: { questId: string; name: string }[] = [];
    for (const q of allQuests) {
      const c = completions[q.questId];
      if (c?.status === "completed" && c.approvedBy) {
        rows.push({ questId: q.questId, name: q.name });
      }
    }
    return rows;
  }, [allQuests, completions]);

  const show = verified.slice(0, 3);
  const more = Math.max(0, verified.length - 3);

  return (
    <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col gap-5">
      <h3 className="font-heading text-lg text-text-primary">Volunteer milestones</h3>
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Verified milestones</p>
        {verified.length === 0 ? (
          <p className="text-sm text-text-muted font-sans">None yet — complete coordinator-approved quests.</p>
        ) : (
          <ul className="text-sm text-text-primary font-sans space-y-1.5">
            {show.map((v) => (
              <li key={v.questId} className="flex gap-2">
                <span className="text-accent-highlight shrink-0">✓</span>
                <span>{v.name}</span>
              </li>
            ))}
            {more > 0 && <li className="text-text-muted text-xs">+ {more} more</li>}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-[#0a0a0f] border border-border py-2 px-1">
          <p className="text-lg font-heading text-[#06B6D4] tabular-nums" style={{ animation: "count-pulse 600ms cubic-bezier(0.16, 1, 0.3, 1) 350ms 1 both" }}>{eventCount}</p>
          <p className="text-[10px] text-text-muted font-sans leading-tight">Events contributed</p>
        </div>
        <div className="rounded-lg bg-[#0a0a0f] border border-border py-2 px-1">
          <p className="text-lg font-heading text-[#FACC15] tabular-nums" style={{ animation: "count-pulse 600ms cubic-bezier(0.16, 1, 0.3, 1) 450ms 1 both" }}>{reflectionCount}</p>
          <p className="text-[10px] text-text-muted font-sans leading-tight">Reflections</p>
        </div>
        <div className="rounded-lg bg-[#0a0a0f] border border-border py-2 px-1">
          <p className="text-lg font-heading text-[#A855F7] tabular-nums" style={{ animation: "count-pulse 600ms cubic-bezier(0.16, 1, 0.3, 1) 550ms 1 both" }}>{badgesEarned}</p>
          <p className="text-[10px] text-text-muted font-sans leading-tight">Badges earned</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCopyShare}
        className="w-full py-3 rounded-xl font-heading font-semibold bg-accent-highlight text-white hover:bg-accent-primary transition-colors"
      >
        <span key={copied ? "copied" : "share"} style={copied ? { animation: "pop 250ms cubic-bezier(0.16, 1, 0.3, 1) both", display: "inline-block" } : undefined}>
          {copied ? "Copied!" : "Copy Share Link"}
        </span>
      </button>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

interface BadgeDef {
  id: number;
  name: string;
  description: string;
  earned: boolean;
}

function BadgeTile({ badge }: { badge: BadgeDef }) {
  return (
    <div
      className="relative rounded-xl border border-border bg-[#0a0a0f] p-4 flex flex-col items-center gap-2 text-center group hover:scale-[1.03] transition-transform duration-200"
      title={badge.earned ? "Earned" : badge.description}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
          badge.earned ? "" : "grayscale opacity-50"
        }`}
        style={
          badge.earned
            ? { boxShadow: "0 0 0 2px #7C3AED", backgroundColor: "#1a1a2e" }
            : { backgroundColor: "#1a1a2e" }
        }
      >
        <span aria-hidden>🏅</span>
      </div>
      {!badge.earned && (
        <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-zinc-500">
          <LockIcon className="w-3 h-3" />
        </div>
      )}
      <p className="text-xs font-heading font-semibold text-text-primary leading-tight">{badge.name}</p>
    </div>
  );
}

function BadgesGrid({ badges }: { badges: BadgeDef[] }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 6;

  const earned = badges.filter((b) => b.earned);
  const unearned = badges.filter((b) => !b.earned);
  // Fill up to LIMIT: all earned first, then as many unearned as fit
  const preview = [...earned, ...unearned].slice(0, LIMIT);
  const displayed = expanded ? badges : preview;
  const hasMore = badges.length > LIMIT;

  return (
    <div id="badges" className="rounded-2xl bg-surface border border-border p-6 flex flex-col gap-4 scroll-mt-24">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg text-text-primary">Badges</h3>
        <span className="text-xs text-text-muted font-sans">{earned.length} / {badges.length} earned</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {displayed.map((b) => (
          <BadgeTile key={b.id} badge={b} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full py-2 rounded-xl border border-border text-xs font-heading uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors"
        >
          {expanded ? "Show Less" : `Show All ${badges.length} Badges`}
        </button>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5 pb-10">
      {/* Header card */}
      <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] animate-pulse p-5">
        <div className="flex gap-4">
          <SkeletonBlock className="w-[72px] h-[72px] rounded-2xl shrink-0" />
          <div className="flex flex-col gap-3 flex-1">
            <SkeletonLine className="w-32" />
            <SkeletonLine className="w-48" />
            <SkeletonLine className="w-24" />
          </div>
        </div>
        <div className="border-t border-[#27272A] mt-5 pt-5 flex flex-col gap-3">
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-3/4" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-1/2" />
        </div>
      </div>
      {/* Milestones section */}
      <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] animate-pulse p-5 flex flex-col gap-4">
        <SkeletonLine className="w-32" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <SkeletonLine className="w-28" />
              <SkeletonLine className="w-20" />
            </div>
          </div>
        ))}
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <SkeletonBlock className="h-16 rounded-xl" />
        <SkeletonBlock className="h-16 rounded-xl" />
        <SkeletonBlock className="h-16 rounded-xl" />
      </div>
      {/* Activity feed */}
      <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] animate-pulse p-5 flex flex-col gap-4">
        <SkeletonLine className="w-24" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <SkeletonBlock className="w-2 h-2 rounded-full mt-1 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [firebaseUid, setFirebaseUid] = useState("");

  const [loading, setLoading] = useState(true);
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<Record<string, QuestCompletion>>({});
  const [xpLogRaw, setXpLogRaw] = useState<XPLogEntry[]>([]);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [profileSetupCount, setProfileSetupCount] = useState(0);

  const [activeTeam, setActiveTeam] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setUserData(data);
      setFirebaseUid(user.uid);
      setAuthChecked(true);
      const t = data.teams ?? [];
      if (t.length > 0) setActiveTeam((prev) => (prev && t.includes(prev) ? prev : t[0]));
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!firebaseUid) return;
    async function load() {
      setLoading(true);
      try {
        const xpCol = collection(db, "users", firebaseUid, "xpLog");
        const [
          questsSnap,
          completionsSnap,
          _teamProgressSnap,
          xpSnap,
          reflCountSnap,
          eventCountSnap,
          profileSetupSnap,
        ] = await Promise.all([
          getDocs(collection(db, "quests")),
          getDocs(collection(db, "users", firebaseUid, "questCompletions")),
          getDocs(collection(db, "users", firebaseUid, "teamProgress")),
          getDocs(query(xpCol, orderBy("createdAt", "desc"), limit(21))),
          getCountFromServer(collection(db, "users", firebaseUid, "reflections")),
          getCountFromServer(query(xpCol, where("source", "==", "event_attendance"))),
          getCountFromServer(query(xpCol, where("source", "==", "profile_setup"))),
        ]);
        void _teamProgressSnap;

        setAllQuests(questsSnap.docs.map((d) => d.data() as Quest));
        const map: Record<string, QuestCompletion> = {};
        completionsSnap.docs.forEach((d) => {
          map[d.id] = d.data() as QuestCompletion;
        });
        setCompletions(map);

        const logs = xpSnap.docs.map((d) => ({ ...d.data(), logId: d.id } as XPLogEntry));
        setActivityHasMore(logs.length === 21);
        setXpLogRaw(logs);

        setReflectionCount(reflCountSnap.data().count);
        setEventCount(eventCountSnap.data().count);
        setProfileSetupCount(profileSetupSnap.data().count);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [firebaseUid]);

  const activityEntries = xpLogRaw.slice(0, 20);

  const completedQuestCount = useMemo(
    () => Object.values(completions).filter((c) => c.status === "completed").length,
    [completions]
  );

  const badges = useMemo((): BadgeDef[] => {
    if (!userData) return [];
    const teams = userData.teams ?? [];
    const earnedIdx = (tid: string) => TIER_ORDER.indexOf(getEarnedTier(tid, completions, allQuests));

    const b10 = teams.some((tid) => earnedIdx(tid) >= TIER_ORDER.indexOf("associate"));
    const b11 = teams.some((tid) => earnedIdx(tid) >= TIER_ORDER.indexOf("specialist"));
    const b12 = teams.some((tid) => getEarnedTier(tid, completions, allQuests) === "lead");

    const list: BadgeDef[] = [
      { id: 1, name: "First Steps", description: "Attend at least 1 event", earned: eventCount >= 1 },
      { id: 2, name: "Dedicated Volunteer", description: "Attend at least 5 events", earned: eventCount >= 5 },
      { id: 3, name: "Event Veteran", description: "Attend at least 10 events", earned: eventCount >= 10 },
      { id: 4, name: "First Reflection", description: "Submit at least 1 reflection", earned: reflectionCount >= 1 },
      { id: 5, name: "Reflective Contributor", description: "Submit at least 5 reflections", earned: reflectionCount >= 5 },
      { id: 6, name: "Deep Thinker", description: "Submit at least 10 reflections", earned: reflectionCount >= 10 },
      { id: 7, name: "Quest Starter", description: "Complete at least 1 quest", earned: completedQuestCount >= 1 },
      { id: 8, name: "Quest Achiever", description: "Complete at least 5 quests", earned: completedQuestCount >= 5 },
      { id: 9, name: "Quest Master", description: "Complete at least 10 quests", earned: completedQuestCount >= 10 },
      { id: 10, name: "Associate", description: "Reach Associate tier or higher on any team", earned: b10 },
      { id: 11, name: "Specialist", description: "Reach Specialist tier or higher on any team", earned: b11 },
      { id: 12, name: "Team Lead", description: "Complete the Lead tier on any team", earned: b12 },
      { id: 13, name: "Profile Complete", description: "Complete profile setup", earned: profileSetupCount >= 1 },
      { id: 14, name: "XP Milestone: 500", description: "Reach 500 total XP", earned: (userData.xp ?? 0) >= 500 },
      { id: 15, name: "XP Milestone: 1000", description: "Reach 1000 total XP", earned: (userData.xp ?? 0) >= 1000 },
    ];
    return list;
  }, [userData, completions, allQuests, eventCount, reflectionCount, completedQuestCount, profileSetupCount]);

  const badgesEarned = useMemo(() => badges.filter((b) => b.earned).length, [badges]);

  function handleCopyShare() {
    if (!userData || typeof window === "undefined") return;
    const url = `${window.location.origin}/profile/${userData.username}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerateResume() {
    if (!userData || typeof window === "undefined") return;
    setIsGeneratingResume(true);
    try {
      let aiProfessionalSummary: string | null | undefined;
      let aiSkills: string[] | undefined;
      let aiInvolvementBullets: string[] | undefined;
      try {
        const cu = auth.currentUser;
        if (cu) {
          const token = await cu.getIdToken();
          const res = await fetch("/api/resume-enhance", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = (await res.json()) as {
              enhanced?: boolean;
              professionalSummary?: string | null;
              skills?: unknown;
              involvementBullets?: unknown;
            };
            const skills = Array.isArray(data.skills)
              ? data.skills.map((s) => String(s).trim()).filter(Boolean)
              : [];
            const involvementBullets = Array.isArray(data.involvementBullets)
              ? data.involvementBullets.map((s) => String(s).trim()).filter(Boolean)
              : [];
            const summary =
              typeof data.professionalSummary === "string" && data.professionalSummary.trim()
                ? data.professionalSummary.trim()
                : null;
            if (process.env.NODE_ENV === "development") {
              console.log("[profile] resume-enhance response:", {
                status: res.status,
                enhanced: data.enhanced,
                skillsCount: skills.length,
                bulletsCount: involvementBullets.length,
                hasSummary: Boolean(summary),
              });
            }
            if (summary || skills.length > 0 || involvementBullets.length > 0) {
              aiProfessionalSummary = summary ?? undefined;
              aiSkills = skills.length > 0 ? skills : undefined;
              aiInvolvementBullets = involvementBullets.length > 0 ? involvementBullets : undefined;
            }
          } else if (process.env.NODE_ENV === "development") {
            console.warn("[profile] resume-enhance HTTP", res.status, await res.clone().text());
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[profile] resume-enhance fetch failed:", e);
        }
      }

      const { generateVolunteerResumePdf } = await import("@/lib/generateVolunteerResumePdf");
      const teamsPayload = (userData.teams ?? [])
        .filter((tid) => TEAM_META[tid])
        .map((tid) => {
          const meta = TEAM_META[tid];
          const earned = getEarnedTier(tid, completions, allQuests);
          const earnedTierLabel =
            earned === "lead" ? meta.leadTitle : (TIER_LABELS[earned] ?? earned);
          return { teamLabel: meta.label, earnedTierLabel };
        });

      const completedQuests = allQuests
        .filter((q) => completions[q.questId]?.status === "completed")
        .map((q) => ({
          name: q.name,
          coordinatorVerified: Boolean(completions[q.questId]?.approvedBy),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const earnedBadgeNames = badges.filter((b) => b.earned).map((b) => b.name);

      const recentActivity = xpLogRaw.slice(0, 10).map((e) => ({
        description: e.description,
        dateLabel: e.createdAt ? formatDate(e.createdAt) : "—",
      }));

      await generateVolunteerResumePdf({
        displayName: profileDisplayName(userData.username),
        chapterId: userData.chapterId,
        totalXp: userData.xp ?? 0,
        role: userData.role,
        linkedinUrl: userData.linkedinUrl,
        githubUrl: userData.githubUrl,
        teams: teamsPayload,
        completedQuests,
        impact: {
          eventsAttended: eventCount,
          reflections: reflectionCount,
          questsCompleted: completedQuestCount,
          badgesEarned,
        },
        earnedBadgeNames,
        recentActivity,
        fileBaseName: userData.username,
        aiProfessionalSummary,
        aiSkills,
        aiInvolvementBullets,
      });
    } finally {
      setIsGeneratingResume(false);
    }
  }

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  if (!authChecked || !userData) {
    return (
      <PageShell title="Profile" loading skeleton={<ProfileSkeleton />}>
        {null}
      </PageShell>
    );
  }

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);
  const teams = userData.teams ?? [];
  const milestoneTeam = activeTeam && teams.includes(activeTeam) ? activeTeam : teams[0] ?? "";

  return (
    <PageShell
      title="Profile"
      avatarUrl={avatarUrl}
      loading={loading}
      skeleton={<ProfileSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:items-start pb-10">
          {/* Left column (col-span-2): HeaderCard, Badges, Activity */}
          <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-2">
            <div className="order-1 lg:order-none animate-fade-up" style={{ animationDelay: "0ms" }}>
              <HeaderCard
                userData={userData}
                avatarUrl={avatarUrl}
                onGenerateResume={handleGenerateResume}
                isGeneratingResume={isGeneratingResume}
                onCopyShare={handleCopyShare}
                copied={copied}
              />
            </div>
            <div className="order-4 lg:order-none animate-fade-up" style={{ animationDelay: "180ms" }}>
              <BadgesGrid badges={badges} />
            </div>
            <div className="order-5 lg:order-none animate-fade-up" style={{ animationDelay: "240ms" }}>
              <ActivityFeed entries={activityEntries} hasMore={activityHasMore} />
            </div>
          </div>
          {/* Right column (col-span-1): Volunteer milestones, Team milestones */}
          <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-1">
            <div className="order-2 lg:order-none animate-fade-up" style={{ animationDelay: "60ms" }}>
              <PortfolioCard
                completions={completions}
                allQuests={allQuests}
                eventCount={eventCount}
                reflectionCount={reflectionCount}
                badgesEarned={badgesEarned}
                onCopyShare={handleCopyShare}
                copied={copied}
              />
            </div>
            {milestoneTeam ? (
              <div className="order-3 lg:order-none animate-fade-up" style={{ animationDelay: "120ms" }}>
                <MilestonesSection
                  userData={userData}
                  completions={completions}
                  allQuests={allQuests}
                  activeTeam={milestoneTeam}
                  onTeamChange={setActiveTeam}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
