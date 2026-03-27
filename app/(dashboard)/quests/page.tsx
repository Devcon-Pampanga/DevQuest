"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  writeBatch,
  serverTimestamp,
  increment,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";
import {
  QUESTS,
  TIER_ORDER,
  TIER_LABELS,
  TEAM_META,
} from "@/lib/seed/quests";
import { Quest, QuestCompletion, ApprovalsQueueItem } from "@/types/quest";
import {
  Mission,
  MissionCompletion,
  MissionCompletionStatus,
  MissionApprovalItem,
  DIFFICULTY_META,
} from "@/types/mission";
import Link from "next/link";
import Image from "next/image";

const WAVE_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];

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
  teams: string[];
  xp: number;
  avatarOptions?: AvatarOptions;
}

type UIQuestStatus = "locked" | "available" | "in_progress" | "pending_approval" | "completed";

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

function isTierUnlocked(
  teamId: string,
  tier: Quest["tier"],
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): boolean {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === 0) return true;
  const prevTier = TIER_ORDER[idx - 1];
  const prevQuests = allQuests.filter(q => q.teamId === teamId && q.tier === prevTier);
  return prevQuests.every((q) => completions[q.questId]?.status === "completed");
}

function getCurrentTier(
  teamId: string,
  completions: Record<string, QuestCompletion>,
  allQuests: Quest[]
): Quest["tier"] {
  for (const tier of TIER_ORDER) {
    if (!isTierUnlocked(teamId, tier, completions, allQuests)) continue;
    const tierQuests = allQuests.filter(q => q.teamId === teamId && q.tier === tier);
    const allDone = tierQuests.every((q) => completions[q.questId]?.status === "completed");
    if (!allDone) return tier;
  }
  return TIER_ORDER[TIER_ORDER.length - 1];
}

function getQuestUIStatus(
  quest: Quest,
  completions: Record<string, QuestCompletion>,
  tierUnlocked: boolean
): UIQuestStatus {
  if (!tierUnlocked) return "locked";
  const c = completions[quest.questId];
  if (!c) return "available";
  return c.status as UIQuestStatus;
}

function methodLabel(method: Quest["completionMethod"]): string {
  if (method === "qr_scan") return "QR SCAN";
  if (method === "self_mark") return "SELF-MARK";
  return "COORDINATOR APPROVAL";
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: UIQuestStatus }) {
  const cfg: Record<UIQuestStatus, { label: string; cls: string }> = {
    completed: { label: "COMPLETED ✓", cls: "bg-green-500/15 text-green-400" },
    pending_approval: { label: "PENDING APPROVAL", cls: "bg-yellow-500/15 text-yellow-400" },
    in_progress: { label: "IN PROGRESS", cls: "bg-accent-primary/20 text-accent-highlight" },
    available: { label: "AVAILABLE", cls: "bg-zinc-700/40 text-zinc-400" },
    locked: { label: "LOCKED", cls: "bg-zinc-800/60 text-zinc-600" },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// ─── Quest Dot ────────────────────────────────────────────────────────────────

function QuestDot({ status, color }: { status: UIQuestStatus; color: string }) {
  if (status === "locked") {
    return (
      <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center shrink-0">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (status === "pending_approval") {
    return <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: "#F59E0B" }} />;
  }
  return <div className="w-4 h-4 rounded-full shrink-0 border-2" style={{ borderColor: color, backgroundColor: `${color}30` }} />;
}

// ─── Tier Progress Card ───────────────────────────────────────────────────────
// Merges earned tier (top) and working-toward tier (bottom) into one arc.

function TierProgressCard({
  teamId,
  earnedTier,
  earnedTierLabel,
  currentTierLabel,
  nextTierLabel,
  color,
  quests,
  completions,
  isMaxTier,
}: {
  teamId: string;
  earnedTier: Quest["tier"];
  earnedTierLabel: string;
  currentTierLabel: string;
  nextTierLabel: string | null;
  color: string;
  quests: Quest[];
  completions: Record<string, QuestCompletion>;
  isMaxTier: boolean;
}) {
  const total = quests.length;
  const completedCount = quests.filter(
    (q) => completions[q.questId]?.status === "completed"
  ).length;

  return (
    <div className="rounded-2xl overflow-hidden border border-[#27272A] bg-[#1a1a2e]">
      {/* 4px team-color bar */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} />

      <div className="p-4 sm:p-5">
        {/* ── Top: earned tier — compact, 1 line ── */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/badges/${teamId}_${earnedTier}.png`}
            alt={earnedTierLabel}
            width={44}
            height={44}
            className="object-contain drop-shadow-md shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold tracking-widest text-text-muted">CURRENT TIER</p>
            <p className="font-heading text-base text-text-primary leading-tight truncate">{earnedTierLabel}</p>
          </div>
          {isMaxTier && (
            <span
              className="text-[10px] font-heading font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ color, backgroundColor: `${color}18` }}
            >
              MAX
            </span>
          )}
        </div>

        {/* ── Step divider + working-toward section (hidden when maxed) ── */}
        {!isMaxTier && (
          <>
            {/* Arrow divider */}
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px" style={{ backgroundColor: `${color}25` }} />
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-50 shrink-0"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <div className="flex-1 h-px" style={{ backgroundColor: `${color}25` }} />
            </div>

            {/* ── Bottom: working toward ── */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold tracking-widest text-text-muted mb-0.5">WORKING TOWARD</p>
                  <p className="font-heading text-lg text-text-primary leading-tight">
                    {nextTierLabel ?? currentTierLabel}
                  </p>
                  <p className="text-text-secondary text-xs mt-1">
                    {nextTierLabel
                      ? `Complete all ${total} quests to advance`
                      : "Complete all quests to earn your title"}
                  </p>
                </div>
                <div className="shrink-0 text-right leading-none">
                  <div>
                    <span className="font-heading text-2xl font-bold" style={{ color }}>{completedCount}</span>
                    <span className="text-text-muted font-heading text-lg"> / {total}</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">quests done</p>
                </div>
              </div>

              {/* Progress dots — sole progress indicator */}
              <div className="flex items-center gap-1.5">
                {quests.map((q) => {
                  const s = completions[q.questId]?.status;
                  const isDone = s === "completed";
                  const isPending = s === "pending_approval";
                  return (
                    <div
                      key={q.questId}
                      className="h-2.5 flex-1 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: isDone
                          ? color
                          : isPending
                          ? "#F59E0B"
                          : `${color}20`,
                        border: isDone || isPending ? "none" : `1px solid ${color}40`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Collapsible Quest Tile ───────────────────────────────────────────────────

function CollapsibleQuestTile({
  quest,
  status,
  completion,
  teamColor,
  isExpanded,
  onToggle,
  onSelfMark,
  onSubmitApproval,
  submitting,
}: {
  quest: Quest;
  status: UIQuestStatus;
  completion?: QuestCompletion;
  teamColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSelfMark: () => void;
  onSubmitApproval: (notes: string, evidence: string) => void;
  submitting: boolean;
}) {
  const [notes, setNotes] = useState(completion?.submissionNotes ?? "");
  const [evidence, setEvidence] = useState(completion?.evidenceUrl ?? "");
  const locked = status === "locked";

  useEffect(() => {
    setNotes(completion?.submissionNotes ?? "");
    setEvidence(completion?.evidenceUrl ?? "");
  }, [quest.questId, completion?.submissionNotes, completion?.evidenceUrl]);

  const howToGuide: Record<Quest["completionMethod"], string> = {
    qr_scan: "Register for the relevant event in DevQuest, then ask a coordinator to scan your QR code on event day.",
    self_mark: "Once you've completed the task in real life, tap Mark Complete below to record it.",
    coordinator_approval: "Complete the real-world task, provide evidence or notes below, then submit for a coordinator to review.",
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden
        ${locked ? "opacity-40 border-[#27272A] bg-[#1a1a2e]" : isExpanded ? "border-[#27272A] bg-[#16213e]" : "border-[#27272A] bg-[#1a1a2e] hover:border-zinc-600"}`}
      style={!locked ? { borderLeft: `3px solid ${teamColor}` } : {}}
    >
      {/* ── Collapsed header (always visible) ─────────────────────────── */}
      <button
        onClick={locked ? undefined : onToggle}
        disabled={locked}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <QuestDot status={status} color={teamColor} />

        <div className="flex-1 min-w-0">
          <span
            className={`font-heading text-sm font-medium leading-snug ${
              locked ? "text-zinc-500" : "text-text-primary"
            }`}
          >
            {quest.name}
          </span>
          {!isExpanded && !locked && (
            <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
              {quest.description}
            </p>
          )}
          {locked && (
            <p className="text-xs text-zinc-600 mt-0.5">Complete previous quests to unlock</p>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!locked && quest.xpReward > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: teamColor, backgroundColor: `${teamColor}18` }}
            >
              +{quest.xpReward} XP
            </span>
          )}
          {!locked && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
              {/* Icon — always visible */}
              {quest.completionMethod === "qr_scan" && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  <path d="M14 14h.01M14 18h.01M18 14h.01M18 18h.01M18 21v.01M21 18h.01M21 21h.01" />
                </svg>
              )}
              {quest.completionMethod === "self_mark" && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {quest.completionMethod === "coordinator_approval" && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              )}
              {/* Text label — sm and up only */}
              <span className="text-xs font-semibold hidden sm:inline">{methodLabel(quest.completionMethod)}</span>
            </span>
          )}
          {!locked && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </button>

      {/* ── Expanded body ──────────────────────────────────────────────── */}
      {isExpanded && !locked && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-[#27272A] animate-fade-in">

          {/* Status + Method row */}
          <div className="flex items-center gap-2 flex-wrap pt-3">
            <StatusBadge status={status} />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 sm:hidden">
              {methodLabel(quest.completionMethod)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-text-secondary leading-relaxed">{quest.description}</p>

          {/* How to complete */}
          <div
            className="rounded-xl p-3.5 flex items-start gap-3"
            style={{ backgroundColor: `${teamColor}0d`, border: `1px solid ${teamColor}25` }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={teamColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: teamColor }}>
                HOW TO COMPLETE
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {howToGuide[quest.completionMethod]}
              </p>
            </div>
          </div>

          {/* Revision feedback */}
          {completion?.revisionNote && (status === "in_progress" || status === "available") && (
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/8 p-3.5">
              <p className="text-xs font-semibold text-orange-400 mb-1.5">
                ⚠ Revision Requested by Coordinator
              </p>
              <p className="text-sm text-orange-200/80 leading-relaxed">
                &ldquo;{completion.revisionNote}&rdquo;
              </p>
            </div>
          )}

          {/* ── Action area ─────────────────────────────────────────── */}
          {quest.completionMethod === "qr_scan" ? (
            status === "completed" ? (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                <p className="text-sm text-green-400 font-semibold">Quest Completed!</p>
                {completion?.completedAt && (
                  <p className="text-xs text-green-500/60 mt-1">{formatDate(completion.completedAt)}</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/40 p-4 flex items-center gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#52525B"
                  strokeWidth="1.5"
                  className="shrink-0"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <path d="M14 14h1v1h-1zM17 14h1v1h-1zM14 17h1v1h-1zM17 17h1v1h-1z" fill="#52525B" />
                </svg>
                <p className="text-sm text-text-secondary">
                  Completed automatically when a coordinator scans your QR code at the event.
                </p>
              </div>
            )
          ) : status === "completed" ? (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
              <svg className="mx-auto mb-2 text-green-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <p className="text-sm text-green-400 font-semibold">Quest Completed!</p>
              {completion?.completedAt && (
                <p className="text-xs text-green-500/60 mt-1">{formatDate(completion.completedAt)}</p>
              )}
            </div>
          ) : status === "pending_approval" ? (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
              <p className="text-sm text-yellow-400 font-semibold">Pending Coordinator Review</p>
              <p className="text-xs text-yellow-500/60 mt-1">
                A coordinator will review your submission soon.
              </p>
              {completion?.submissionNotes && (
                <p className="text-xs text-zinc-400 mt-2">
                  <span className="text-zinc-500">Your notes: </span>
                  {completion.submissionNotes}
                </p>
              )}
            </div>
          ) : quest.completionMethod === "self_mark" ? (
            <button
              onClick={onSelfMark}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-heading font-semibold text-white bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Marking…" : "Mark Complete"}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                  Evidence &amp; Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe what you did, link to your work, or provide any relevant context…"
                  rows={3}
                  className="w-full rounded-xl bg-[#0a0a0f] border border-[#27272A] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-primary/60 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="https://drive.google.com/…"
                  className="w-full rounded-xl bg-[#0a0a0f] border border-[#27272A] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/60 transition-colors"
                />
              </div>
              <button
                onClick={() => onSubmitApproval(notes, evidence)}
                disabled={submitting || !notes.trim()}
                className="w-full py-3.5 rounded-xl font-heading font-semibold text-white bg-accent-highlight hover:bg-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Submitting…" : "Submit for Approval"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Path Journey Sidebar ─────────────────────────────────────────────────────
// Three states: completed (muted, 1 line), current (elevated), future (expandable preview).

function PathJourneySidebar({
  teamId,
  teamColor,
  leadTitle,
  completions,
  allQuests,
}: {
  teamId: string;
  teamColor: string;
  leadTitle: string;
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
}) {
  const currentTier = getCurrentTier(teamId, completions, allQuests);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold tracking-widest text-text-muted mb-3">
        YOUR JOURNEY
      </p>

      {TIER_ORDER.map((tier) => {
        const tierQuests = allQuests.filter(q => q.teamId === teamId && q.tier === tier);
        const unlocked = isTierUnlocked(teamId, tier, completions, allQuests);
        const completedCount = tierQuests.filter(
          (q) => completions[q.questId]?.status === "completed"
        ).length;
        const total = tierQuests.length;
        const isCurrent = tier === currentTier;
        const isCompleted = unlocked && !isCurrent;
        const tierLabel = tier === "lead" ? leadTitle : (TIER_LABELS[tier] ?? tier);
        const currentTierLabel = currentTier === "lead" ? leadTitle : (TIER_LABELS[currentTier] ?? currentTier);

        // ── Future / locked ──────────────────────────────────────────────────
        if (!unlocked) {
          const isExpanded = expandedTier === tier;
          return (
            <div key={tier}>
              <div
                className="px-3 py-2.5 flex items-center gap-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedTier(isExpanded ? null : tier)}
              >
                {/* Greyed-out tier badge */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/badges/${teamId}_${tier}.png`}
                  alt={tierLabel}
                  width={20}
                  height={20}
                  className="object-contain shrink-0 grayscale opacity-30"
                />
                <span className="flex-1 text-sm font-heading text-zinc-600">{tierLabel}</span>
                {total > 0 && (
                  <span className="text-[10px] text-zinc-700 mr-1">· {total} quest{total !== 1 ? "s" : ""}</span>
                )}
                {/* Chevron */}
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="shrink-0 transition-transform duration-200"
                  style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Expanded quest preview */}
              {isExpanded && total > 0 && (
                <div className="ml-3 pl-3 border-l border-zinc-800 pb-2 flex flex-col gap-1 mt-0.5">
                  {tierQuests.map((q) => (
                    <div key={q.questId} className="flex items-start gap-2 py-1">
                      {/* Method icon */}
                      <div className="mt-0.5 shrink-0">
                        {q.completionMethod === "qr_scan" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                            <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 21h.01M21 14h.01M21 18h.01M21 21h.01" />
                          </svg>
                        )}
                        {q.completionMethod === "self_mark" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {q.completionMethod === "coordinator_approval" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1 text-[11px] text-zinc-600 leading-snug">{q.name}</span>
                      {q.xpReward > 0 && (
                        <span className="text-[10px] text-zinc-700 shrink-0">+{q.xpReward}</span>
                      )}
                    </div>
                  ))}
                  <p className="text-[10px] text-zinc-700 italic pt-0.5">
                    Complete {currentTierLabel} to unlock
                  </p>
                </div>
              )}
            </div>
          );
        }

        // ── Completed ────────────────────────────────────────────────────────
        if (isCompleted) {
          const isExpanded = expandedTier === tier;
          return (
            <div key={tier}>
              <div
                className="px-3 py-2 flex items-center gap-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedTier(isExpanded ? null : tier)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/badges/${teamId}_${tier}.png`}
                  alt={tierLabel}
                  width={24}
                  height={24}
                  className="object-contain shrink-0 opacity-40"
                />
                <span className="flex-1 text-sm font-heading text-zinc-500 truncate">{tierLabel}</span>
                {/* Checkmark */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {/* Chevron */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {isExpanded && total > 0 && (
                <div className="ml-3 pl-3 border-l border-zinc-800 pb-2 flex flex-col gap-1 mt-0.5">
                  {tierQuests.map((q) => (
                    <div key={q.questId} className="flex items-start gap-2 py-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="flex-1 text-[11px] text-zinc-600 leading-snug line-through">{q.name}</span>
                      {q.xpReward > 0 && (
                        <span className="text-[10px] text-zinc-700 shrink-0">+{q.xpReward}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // ── Current ──────────────────────────────────────────────────────────
        const isExpanded = expandedTier === tier;
        return (
          <div
            key={tier}
            className="rounded-xl bg-[#16213e] border border-[#27272A] overflow-hidden"
            style={{ borderLeft: `3px solid ${teamColor}` }}
          >
            <div
              className="py-3 pr-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
              style={{ paddingLeft: "0.875rem" }}
              onClick={() => setExpandedTier(isExpanded ? null : tier)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/badges/${teamId}_${tier}.png`}
                alt={tierLabel}
                width={40}
                height={40}
                className="object-contain drop-shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-bold leading-tight truncate" style={{ color: teamColor }}>
                  {tierLabel}
                </p>
                {total > 0 && (
                  <p className="text-xs text-text-muted mt-0.5">{completedCount}/{total} quests</p>
                )}
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {isExpanded && total > 0 && (
              <div className="px-3.5 pb-3 flex flex-col gap-1 border-t border-[#27272A] pt-2.5">
                {tierQuests.map((q) => {
                  const done = completions[q.questId]?.status === "completed";
                  return (
                    <div key={q.questId} className="flex items-start gap-2 py-0.5">
                      {done ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div className="w-[11px] h-[11px] rounded-full border mt-0.5 shrink-0" style={{ borderColor: teamColor }} />
                      )}
                      <span className={`flex-1 text-[11px] leading-snug ${done ? "text-zinc-600 line-through" : "text-zinc-300"}`}>{q.name}</span>
                      {q.xpReward > 0 && (
                        <span className="text-[10px] text-zinc-600 shrink-0">+{q.xpReward}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Approvals Queue Item ─────────────────────────────────────────────────────

function ApprovalItem({
  item,
  onApprove,
  onRevise,
  submitting,
}: {
  item: ApprovalsQueueItem;
  onApprove: () => void;
  onRevise: (note: string) => void;
  submitting: boolean;
}) {
  const [revising, setRevising] = useState(false);
  const [revNote, setRevNote] = useState("");
  const meta = TEAM_META[item.teamId];
  const quest = QUESTS.find((q) => q.questId === item.questId);

  return (
    <div className="rounded-2xl bg-[#1a1a2e] border border-[#27272A] p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={buildAvatarUrl(item.username, item.avatarOptions ?? DEFAULT_AVATAR)}
          alt=""
          width={40}
          height={40}
          className="rounded-xl border border-[#27272A] shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading text-text-primary text-sm font-semibold">
              {item.username}
            </span>
            {meta && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
              >
                {meta.label}
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm mt-0.5">{item.questName}</p>
          {item.submittedAt && (
            <p className="text-xs text-text-muted mt-0.5">
              Submitted {formatDate(item.submittedAt)}
            </p>
          )}
        </div>
      </div>

      {item.submissionNotes && (
        <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/30 p-3">
          <p className="text-xs text-text-muted mb-1">Notes</p>
          <p className="text-sm text-text-secondary leading-relaxed">{item.submissionNotes}</p>
        </div>
      )}
      {item.evidenceUrl && (
        <a
          href={item.evidenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent-highlight underline underline-offset-2 break-all"
        >
          {item.evidenceUrl}
        </a>
      )}

      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="font-semibold" style={{ color: meta?.color }}>
          +{item.xpReward} XP
        </span>
        {quest && (
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-semibold">
            {methodLabel(quest.completionMethod)}
          </span>
        )}
      </div>

      {revising && (
        <textarea
          value={revNote}
          onChange={(e) => setRevNote(e.target.value)}
          placeholder="Explain what the volunteer needs to revise…"
          rows={3}
          className="w-full rounded-xl bg-[#16213e] border border-orange-500/30 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-orange-500/60 transition-colors"
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl text-sm font-heading font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 transition-colors"
        >
          Approve
        </button>
        {!revising ? (
          <button
            onClick={() => setRevising(true)}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-heading font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 disabled:opacity-50 transition-colors"
          >
            Request Revision
          </button>
        ) : (
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => { onRevise(revNote); setRevising(false); setRevNote(""); }}
              disabled={submitting || !revNote.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-heading font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
            <button
              onClick={() => { setRevising(false); setRevNote(""); }}
              className="px-3 py-2.5 rounded-xl text-sm text-zinc-400 bg-zinc-800/40 hover:bg-zinc-700/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Missions Panel ───────────────────────────────────────────────────────────

function MissionStatusPill({ status }: { status: MissionCompletionStatus | "available" }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    available:    { label: "Open",            bg: "#06B6D41A", color: "#06B6D4" },
    assigned:     { label: "Assigned",         bg: "#A855F71A", color: "#A855F7" },
    joined:       { label: "In Progress",      bg: "#F5C5181A", color: "#F5C518" },
    submitted:    { label: "Pending Review",   bg: "#F974161A", color: "#F97316" },
    completed:    { label: "Completed",        bg: "#22C55E1A", color: "#22C55E" },
  };
  const s = map[status] ?? map.available;
  return (
    <span
      className="text-[10px] font-heading font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function MissionApprovalCard({
  item,
  onApprove,
  onRevise,
  submitting,
}: {
  item: MissionApprovalItem;
  onApprove: () => void;
  onRevise: (note: string) => void;
  submitting: boolean;
}) {
  const [revising, setRevising] = useState(false);
  const [revNote, setRevNote] = useState("");
  const diffMeta = DIFFICULTY_META[item.difficulty];
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?${new URLSearchParams({
    seed: item.username,
    backgroundColor: item.avatarOptions?.backgroundColor ?? "5e35b1",
    backgroundType: item.avatarOptions?.backgroundType ?? "solid",
    eyes: item.avatarOptions?.eyes ?? "round",
    mouth: item.avatarOptions?.mouth ?? "smile01",
  })}`;

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#16213e] p-3.5">
      <div className="flex items-start gap-3">
        <img src={avatarUrl} alt={item.username} className="w-8 h-8 rounded-full shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-heading text-text-primary">{item.username}</p>
            <span
              className="text-[10px] font-heading px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${diffMeta.color}1A`, color: diffMeta.color }}
            >
              {diffMeta.label}
            </span>
          </div>
          <p className="text-xs text-text-muted truncate mt-0.5">{item.missionTitle}</p>
          {item.submissionNotes && (
            <p className="text-xs text-text-secondary mt-1.5 italic">&ldquo;{item.submissionNotes}&rdquo;</p>
          )}
          {item.evidenceUrl && (
            <a
              href={item.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent-highlight hover:underline mt-1 block truncate"
            >
              {item.evidenceUrl}
            </a>
          )}
        </div>
        <span className="text-xs font-heading text-accent-highlight shrink-0 mt-0.5">+{item.xpReward} XP</span>
      </div>

      {!revising ? (
        <div className="flex gap-2 mt-3">
          <button
            onClick={onApprove}
            disabled={submitting}
            className="flex-1 py-2 rounded-lg text-xs font-heading font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 disabled:opacity-50 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => setRevising(true)}
            disabled={submitting}
            className="flex-1 py-2 rounded-lg text-xs font-heading font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 disabled:opacity-50 transition-colors"
          >
            Request Revision
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-highlight resize-none"
            rows={2}
            placeholder="What needs to be revised?"
            value={revNote}
            onChange={(e) => setRevNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onRevise(revNote); setRevising(false); setRevNote(""); }}
              disabled={submitting || !revNote.trim()}
              className="flex-1 py-2 rounded-lg text-xs font-heading font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
            <button
              onClick={() => { setRevising(false); setRevNote(""); }}
              className="px-3 py-2 rounded-lg text-xs text-zinc-400 bg-zinc-800/40 hover:bg-zinc-700/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MissionsPanel({
  userData,
  missions,
  missionCompletions,
  missionApprovals,
  loadingMissions,
  loadingMissionApprovals,
  expandedMissionId,
  setExpandedMissionId,
  submitting,
  onJoin,
  onSubmit,
  onApprove,
  onRevise,
}: {
  userData: { uid: string; username: string; role: string; teams: string[] };
  missions: Mission[];
  missionCompletions: Record<string, MissionCompletion>;
  missionApprovals: MissionApprovalItem[];
  loadingMissions: boolean;
  loadingMissionApprovals: boolean;
  expandedMissionId: string | null;
  setExpandedMissionId: (id: string | null) => void;
  submitting: boolean;
  onJoin: (m: Mission) => void;
  onSubmit: (m: Mission, notes: string, evidence: string) => void;
  onApprove: (item: MissionApprovalItem) => void;
  onRevise: (item: MissionApprovalItem, note: string) => void;
}) {
  const isCoordinator = userData.role === "coordinator";

  // Filter missions visible to this volunteer
  const visibleMissions = isCoordinator
    ? missions
    : missions.filter((m) => {
        if (m.assignmentType === "open") return true;
        if (m.assignmentType === "specific") return m.assignedTo?.includes(userData.uid);
        if (m.assignmentType === "team") return m.assignedTeams?.some((t) => userData.teams.includes(t));
        return false;
      });

  function getMissionStatus(mission: Mission): MissionCompletionStatus | "available" {
    const c = missionCompletions[mission.missionId];
    if (!c) return "available";
    return c.status;
  }

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden animate-fade-up"
      style={{ backgroundColor: "#1e1a2e", animationDelay: "280ms" }}
    >
      <div className="h-[3px] w-full" style={{ backgroundColor: "#A855F7" }} />
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start gap-2 mb-4">
          <div className="flex-1 min-w-0">
            <p className="font-heading text-base font-bold text-text-primary leading-tight">MISSIONS</p>
            <p className="text-xs text-text-muted mt-0.5">Coordinator-assigned tasks · Bonus XP</p>
          </div>
          {isCoordinator && (
            <Link
              href="/missions/new"
              className="w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-white hover:bg-accent-primary transition-colors"
              title="Create Mission"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>
          )}
        </div>

        {loadingMissions ? (
          <div className="flex items-center gap-1.5 py-4 justify-center">
            {["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"].map((c, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : visibleMissions.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="text-text-secondary text-xs font-heading">No active missions</p>
            {isCoordinator && (
              <Link href="/missions/new" className="text-accent-highlight text-xs hover:underline mt-1 inline-block">
                Create one →
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleMissions.map((mission) => {
              const diffMeta = DIFFICULTY_META[mission.difficulty];
              const status = getMissionStatus(mission);
              const completion = missionCompletions[mission.missionId];
              const isExpanded = expandedMissionId === mission.missionId;

              return (
                <MissionTile
                  key={mission.missionId}
                  mission={mission}
                  diffMeta={diffMeta}
                  status={status}
                  completion={completion}
                  isExpanded={isExpanded}
                  isCoordinator={isCoordinator}
                  submitting={submitting}
                  onToggle={() => setExpandedMissionId(isExpanded ? null : mission.missionId)}
                  onJoin={() => onJoin(mission)}
                  onSubmit={(notes, evidence) => onSubmit(mission, notes, evidence)}
                />
              );
            })}
          </div>
        )}

        {/* Coordinator: mission approvals */}
        {isCoordinator && (
          <>
            <div className="flex items-center gap-3 mt-5 mb-3">
              <p className="text-xs font-semibold text-text-muted tracking-widest uppercase">
                Pending Approvals
              </p>
              <div className="flex-1 h-px bg-[#27272A]" />
              {missionApprovals.length > 0 && (
                <span className="text-xs bg-accent-highlight text-white rounded-full px-1.5 py-0.5">
                  {missionApprovals.length}
                </span>
              )}
            </div>
            {loadingMissionApprovals ? (
              <div className="flex items-center gap-1.5 py-3 justify-center">
                {["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"].map((c, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            ) : missionApprovals.length === 0 ? (
              <p className="text-text-muted text-xs text-center py-2">No pending reviews</p>
            ) : (
              <div className="flex flex-col gap-2">
                {missionApprovals.map((item) => (
                  <MissionApprovalCard
                    key={`${item.userId}-${item.missionId}`}
                    item={item}
                    onApprove={() => onApprove(item)}
                    onRevise={(note) => onRevise(item, note)}
                    submitting={submitting}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MissionTile({
  mission,
  diffMeta,
  status,
  completion,
  isExpanded,
  isCoordinator,
  submitting,
  onToggle,
  onJoin,
  onSubmit,
}: {
  mission: Mission;
  diffMeta: { label: string; color: string; xp: number };
  status: MissionCompletionStatus | "available";
  completion?: MissionCompletion;
  isExpanded: boolean;
  isCoordinator: boolean;
  submitting: boolean;
  onToggle: () => void;
  onJoin: () => void;
  onSubmit: (notes: string, evidence: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState("");

  const canJoin = !isCoordinator && status === "available" && mission.assignmentType === "open";
  const canSubmit = !isCoordinator && (status === "joined" || status === "assigned");

  const deadlineStr = mission.deadline
    ? mission.deadline.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div>
      {/* Tile header — click to expand */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200"
        style={{
          borderColor: isExpanded ? `${diffMeta.color}40` : "#27272A",
          backgroundColor: isExpanded ? `${diffMeta.color}0D` : "transparent",
        }}
      >
        {/* Difficulty color bar */}
        <div
          className="w-0.5 self-stretch rounded-full shrink-0"
          style={{ backgroundColor: diffMeta.color, minHeight: "20px" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading text-text-primary leading-tight truncate">
            {mission.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span
              className="text-[10px] font-heading px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${diffMeta.color}1A`, color: diffMeta.color }}
            >
              {diffMeta.label}
            </span>
            <MissionStatusPill status={status} />
            <span className="text-[10px] text-text-muted">+{mission.xpReward} XP</span>
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 mt-1 transition-transform duration-200"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div
          className="border border-t-0 rounded-b-xl px-3 pb-3"
          style={{ borderColor: `${diffMeta.color}30`, backgroundColor: `${diffMeta.color}06` }}
        >
          <p className="text-xs text-text-secondary pt-3 leading-relaxed">
            {mission.description}
          </p>

          <div className="flex flex-wrap gap-3 mt-3">
            {deadlineStr && (
              <div className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-[10px] text-text-muted">Due {deadlineStr}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-[10px] text-text-muted capitalize">{mission.assignmentType === "open" ? `Open · ${mission.slots ?? "∞"} slots` : mission.assignmentType}</span>
            </div>
          </div>

          {/* Revision note */}
          {completion?.revisionNote && (
            <div className="mt-3 rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
              <p className="text-[10px] font-heading text-orange-400 uppercase tracking-wide mb-1">Revision Requested</p>
              <p className="text-xs text-orange-300">{completion.revisionNote}</p>
            </div>
          )}

          {/* Submission guidance */}
          {mission.submissionGuidance && canSubmit && (
            <div className="mt-3 rounded-lg bg-[#ffffff06] border border-[#27272A] px-3 py-2">
              <p className="text-[10px] font-heading text-text-muted uppercase tracking-wide mb-1">What to submit</p>
              <p className="text-xs text-text-secondary">{mission.submissionGuidance}</p>
            </div>
          )}

          {/* Action: Join */}
          {canJoin && (
            <button
              onClick={onJoin}
              disabled={submitting}
              className="mt-3 w-full py-2.5 rounded-xl text-xs font-heading font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
            >
              {submitting ? "Joining…" : "Join Mission"}
            </button>
          )}

          {/* Action: Submit */}
          {canSubmit && (
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-highlight resize-none"
                rows={2}
                placeholder="Describe what you did…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <input
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-highlight"
                placeholder="Evidence URL (optional)"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
              <button
                onClick={() => onSubmit(notes, evidence)}
                disabled={submitting || !notes.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-heading font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
              >
                {submitting ? "Submitting…" : "Submit for Review"}
              </button>
            </div>
          )}

          {/* Status: submitted / completed */}
          {!canJoin && !canSubmit && !isCoordinator && (
            <div className="mt-3">
              {status === "submitted" && (
                <p className="text-xs text-text-muted text-center py-2">
                  Waiting for coordinator review…
                </p>
              )}
              {status === "completed" && (
                <p className="text-xs text-emerald-400 text-center py-2 font-heading">
                  ✓ Completed · +{mission.xpReward} XP earned
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function QuestsSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 pb-10 items-start">
      {/* Team tabs — full width */}
      <div className="lg:col-span-3 flex gap-2">
        <SkeletonBlock className="h-9 w-28 rounded-full" />
        <SkeletonBlock className="h-9 w-28 rounded-full" />
        <SkeletonBlock className="h-9 w-28 rounded-full" />
      </div>
      {/* Left col */}
      <div className="flex flex-col gap-3 lg:col-span-2">
        {/* Tier section 1 */}
        <div className="flex flex-col gap-3">
          <SkeletonLine className="w-20" />
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 animate-pulse flex flex-col gap-2"
            >
              <SkeletonLine className="w-40" />
              <SkeletonLine className="w-full" />
              <SkeletonBlock className="h-1.5 rounded-full w-full" />
            </div>
          ))}
        </div>
        {/* Tier section 2 — locked look */}
        <div className="flex flex-col gap-3 opacity-50">
          <SkeletonLine className="w-20" />
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] p-4 animate-pulse flex flex-col gap-2"
            >
              <SkeletonLine className="w-40" />
              <SkeletonLine className="w-full" />
              <SkeletonBlock className="h-1.5 rounded-full w-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Right col */}
      <div className="lg:col-span-1">
        <SkeletonBlock className="h-52 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function LockIconSmall() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function getEarnedTier(
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

interface QuestBadgeDef {
  name: string;
  description: string;
  earned: boolean;
  image: string;
}

function QuestBadgeTile({ badge }: { badge: QuestBadgeDef }) {
  return (
    <div
      className="relative rounded-xl border border-border bg-[#0a0a0f] p-3 flex flex-col items-center gap-2 text-center hover:scale-[1.03] transition-transform duration-200"
      title={badge.earned ? badge.name : badge.description}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          badge.earned ? "" : "grayscale opacity-50"
        }`}
        style={
          badge.earned
            ? { boxShadow: "0 0 0 2px #7C3AED", backgroundColor: "#1a1a2e" }
            : { backgroundColor: "#1a1a2e" }
        }
      >
        <Image src={badge.image} alt={badge.name} width={32} height={32} className="object-contain" />
      </div>
      {!badge.earned && (
        <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-zinc-500">
          <LockIconSmall />
        </div>
      )}
      <p className="text-[10px] font-heading font-semibold text-text-primary leading-tight">{badge.name}</p>
    </div>
  );
}

function QuestBadgesCard({
  teamColor,
  completions,
  allQuests,
  teams,
  xp,
  eventCount,
  reflectionCount,
  profileSetupCount,
}: {
  teamColor: string;
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
  teams: string[];
  xp: number;
  eventCount: number;
  reflectionCount: number;
  profileSetupCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 6;

  const completedQuestCount = Object.values(completions).filter(
    (c) => c.status === "completed"
  ).length;

  const earnedIdx = (tid: string) =>
    TIER_ORDER.indexOf(getEarnedTier(tid, completions, allQuests));

  const b10 = teams.some((tid) => earnedIdx(tid) >= TIER_ORDER.indexOf("associate"));
  const b11 = teams.some((tid) => earnedIdx(tid) >= TIER_ORDER.indexOf("specialist"));
  const b12 = teams.some((tid) => getEarnedTier(tid, completions, allQuests) === "lead");

  const badges: QuestBadgeDef[] = [
    { name: "First Steps",           description: "Attend at least 1 event",                         earned: eventCount >= 1,           image: "/medals/first-steps.png" },
    { name: "Dedicated Volunteer",   description: "Attend at least 5 events",                        earned: eventCount >= 5,           image: "/medals/dedicated-volunteer.png" },
    { name: "Event Veteran",         description: "Attend at least 10 events",                       earned: eventCount >= 10,          image: "/medals/event-veteran.png" },
    { name: "First Reflection",      description: "Submit at least 1 reflection",                    earned: reflectionCount >= 1,      image: "/medals/first-reflection.png" },
    { name: "Reflective Contributor",description: "Submit at least 5 reflections",                   earned: reflectionCount >= 5,      image: "/medals/reflective-contributor.png" },
    { name: "Deep Thinker",          description: "Submit at least 10 reflections",                  earned: reflectionCount >= 10,     image: "/medals/deep-thinker.png" },
    { name: "Quest Starter",         description: "Complete at least 1 quest",                       earned: completedQuestCount >= 1,  image: "/medals/quest-starter.png" },
    { name: "Quest Achiever",        description: "Complete at least 5 quests",                      earned: completedQuestCount >= 5,  image: "/medals/quest-achiever.png" },
    { name: "Quest Master",          description: "Complete at least 10 quests",                     earned: completedQuestCount >= 10, image: "/medals/quest-master.png" },
    { name: "Associate",             description: "Reach Associate tier or higher on any team",      earned: b10,                       image: "/medals/associate.png" },
    { name: "Specialist",            description: "Reach Specialist tier or higher on any team",     earned: b11,                       image: "/medals/specialist.png" },
    { name: "Team Lead",             description: "Complete the Lead tier on any team",              earned: b12,                       image: "/medals/team-lead.png" },
    { name: "Profile Complete",      description: "Complete profile setup",                          earned: profileSetupCount >= 1,    image: "/medals/profile-complete.png" },
    { name: "XP Milestone: 500",     description: "Reach 500 total XP",                             earned: xp >= 500,                 image: "/medals/xp-500.png" },
    { name: "XP Milestone: 1000",    description: "Reach 1000 total XP",                            earned: xp >= 1000,                image: "/medals/xp-1000.png" },
  ];

  const earnedBadges = badges.filter((b) => b.earned);
  const unearnedBadges = badges.filter((b) => !b.earned);
  const preview = [...earnedBadges, ...unearnedBadges].slice(0, LIMIT);
  const displayed = expanded ? badges : preview;
  const earned = earnedBadges.length;

  return (
    <div className="rounded-2xl border border-border overflow-hidden animate-fade-up" style={{ backgroundColor: "#1e1a2e", animationDelay: "300ms" }}>
      <div className="h-[3px] w-full" style={{ backgroundColor: teamColor }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-semibold text-text-muted tracking-widest uppercase">Badges</p>
          <div className="flex-1 h-px bg-[#27272A]" />
          <p className="text-xs text-text-muted">{earned} / {badges.length}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {displayed.map((b) => (
            <QuestBadgeTile key={b.name} badge={b} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full py-2 rounded-xl border border-border text-xs font-heading uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors"
        >
          {expanded ? "Show Less" : `Show All ${badges.length} Badges`}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function QuestsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [firebaseUid, setFirebaseUid] = useState<string>("");

  const [quests, setQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<Record<string, QuestCompletion>>({});
  const [loadingCompletions, setLoadingCompletions] = useState(true);
  const [eventCount, setEventCount] = useState(0);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [profileSetupCount, setProfileSetupCount] = useState(0);

  const [approvals, setApprovals] = useState<ApprovalsQueueItem[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<Record<string, MissionCompletion>>({});
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [missionApprovals, setMissionApprovals] = useState<MissionApprovalItem[]>([]);
  const [loadingMissionApprovals, setLoadingMissionApprovals] = useState(false);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("");
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data()?.onboardingComplete !== true) {
        router.replace("/onboarding");
        return;
      }
      const data = { uid: user.uid, ...snap.data() } as UserData;
      setUserData(data);
      setFirebaseUid(user.uid);
      setAuthChecked(true);
      if (data.teams?.length > 0) setActiveTab(data.teams[0]);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!userData) return;
    const tab = searchParams.get("tab");
    if (tab === "approvals" && userData.role === "coordinator") {
      setActiveTab("approvals");
    }
  }, [searchParams, userData]);

  // ── Load quests (from Firestore) + completions ──────────────────────────────
  useEffect(() => {
    if (!firebaseUid || !userData) return;
    async function load() {
      setLoadingCompletions(true);
      setLoadingMissions(true);
      try {
        const xpCol = collection(db, "users", firebaseUid, "xpLog");
        const [questsSnap, completionsSnap, missionsSnap, missionCompletionsSnap, reflCountSnap, eventCountSnap, profileSetupSnap] = await Promise.all([
          getDocs(collection(db, "quests")),
          getDocs(collection(db, "users", firebaseUid, "questCompletions")),
          getDocs(query(collection(db, "missions"), where("chapterId", "==", userData!.chapterId), where("status", "==", "active"))),
          getDocs(collection(db, "users", firebaseUid, "missionCompletions")),
          getCountFromServer(collection(db, "users", firebaseUid, "reflections")),
          getCountFromServer(query(xpCol, where("source", "==", "event_attendance"))),
          getCountFromServer(query(xpCol, where("source", "==", "profile_setup"))),
        ]);
        setQuests(questsSnap.docs.map(d => d.data() as Quest));
        const map: Record<string, QuestCompletion> = {};
        completionsSnap.docs.forEach((d) => { map[d.id] = d.data() as QuestCompletion; });
        setCompletions(map);
        setMissions(missionsSnap.docs.map(d => ({ ...d.data(), missionId: d.id } as Mission)));
        const mmap: Record<string, MissionCompletion> = {};
        missionCompletionsSnap.docs.forEach((d) => { mmap[d.id] = d.data() as MissionCompletion; });
        setMissionCompletions(mmap);
        setReflectionCount(reflCountSnap.data().count);
        setEventCount(eventCountSnap.data().count);
        setProfileSetupCount(profileSetupSnap.data().count);
      } finally {
        setLoadingCompletions(false);
        setLoadingMissions(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUid, userData?.chapterId]);

  // ── Load approvals (coordinator only) ──────────────────────────────────────
  const loadApprovals = useCallback(async () => {
    if (!userData || userData.role !== "coordinator") return;
    setLoadingApprovals(true);
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("chapterId", "==", userData.chapterId))
      );
      const items: ApprovalsQueueItem[] = [];
      await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
          const u = userDoc.data();
          const completionsSnap = await getDocs(
            query(
              collection(db, "users", userDoc.id, "questCompletions"),
              where("status", "==", "pending_approval")
            )
          );
          completionsSnap.docs.forEach((cd) => {
            const c = cd.data() as QuestCompletion;
            const quest = quests.find((q) => q.questId === cd.id);
            if (!quest) return;
            items.push({
              userId: userDoc.id,
              username: u.username,
              avatarOptions: u.avatarOptions,
              teamId: quest.teamId,
              questId: quest.questId,
              questName: quest.name,
              submissionNotes: c.submissionNotes,
              evidenceUrl: c.evidenceUrl,
              xpReward: quest.xpReward,
              submittedAt: (cd.data() as Record<string, Timestamp>).updatedAt,
            });
          });
        })
      );
      setApprovals(items);
    } finally {
      setLoadingApprovals(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  useEffect(() => {
    if (authChecked && userData?.role === "coordinator") loadApprovals();
  }, [authChecked, userData, loadApprovals]);

  // ── Load mission approvals (coordinator only) ────────────────────────────────
  const loadMissionApprovals = useCallback(async () => {
    if (!userData || userData.role !== "coordinator") return;
    setLoadingMissionApprovals(true);
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("chapterId", "==", userData.chapterId))
      );
      const items: MissionApprovalItem[] = [];
      await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
          const u = userDoc.data();
          const mCompletionsSnap = await getDocs(
            query(
              collection(db, "users", userDoc.id, "missionCompletions"),
              where("status", "==", "submitted")
            )
          );
          mCompletionsSnap.docs.forEach((cd) => {
            const c = cd.data() as MissionCompletion;
            const mission = missions.find((m) => m.missionId === cd.id);
            if (!mission) return;
            items.push({
              userId: userDoc.id,
              username: u.username,
              avatarOptions: u.avatarOptions,
              missionId: mission.missionId,
              missionTitle: mission.title,
              difficulty: mission.difficulty,
              xpReward: mission.xpReward,
              submissionNotes: c.submissionNotes,
              evidenceUrl: c.evidenceUrl,
              submittedAt: (cd.data() as Record<string, Timestamp>).updatedAt,
            });
          });
        })
      );
      setMissionApprovals(items);
    } finally {
      setLoadingMissionApprovals(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, missions]);

  useEffect(() => {
    if (authChecked && userData?.role === "coordinator" && missions.length > 0) {
      loadMissionApprovals();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, userData?.role, missions.length]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function handleSelfMark(quest: Quest) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      batch.set(doc(db, "users", firebaseUid, "questCompletions", quest.questId), {
        questId: quest.questId,
        status: "completed",
        xpGranted: quest.xpReward,
        completedAt: now,
      });
      batch.update(doc(db, "users", firebaseUid), { xp: increment(quest.xpReward) });
      await batch.commit();
      await addDoc(collection(db, "users", firebaseUid, "xpLog"), {
        source: "quest_completion",
        sourceId: quest.questId,
        description: `Completed: ${quest.name}`,
        xp: quest.xpReward,
        createdAt: now,
      });
      setCompletions((prev) => ({
        ...prev,
        [quest.questId]: {
          questId: quest.questId,
          status: "completed",
          xpGranted: quest.xpReward,
          completedAt: Timestamp.now(),
        },
      }));
      setExpandedQuestId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitApproval(quest: Quest, notes: string, evidence: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "users", firebaseUid, "questCompletions", quest.questId), {
        questId: quest.questId,
        status: "pending_approval",
        submissionNotes: notes,
        evidenceUrl: evidence || null,
        xpGranted: quest.xpReward,
        updatedAt: serverTimestamp(),
      });
      setCompletions((prev) => ({
        ...prev,
        [quest.questId]: {
          questId: quest.questId,
          status: "pending_approval",
          submissionNotes: notes,
          evidenceUrl: evidence || undefined,
          xpGranted: quest.xpReward,
        },
      }));
      setExpandedQuestId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(item: ApprovalsQueueItem) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      batch.update(doc(db, "users", item.userId, "questCompletions", item.questId), {
        status: "completed",
        completedAt: now,
        approvedBy: firebaseUid,
      });
      batch.update(doc(db, "users", item.userId), { xp: increment(item.xpReward) });
      await batch.commit();
      await Promise.all([
        addDoc(collection(db, "users", item.userId, "xpLog"), {
          source: "quest_completion",
          sourceId: item.questId,
          description: `Quest approved: ${item.questName}`,
          xp: item.xpReward,
          createdAt: now,
        }),
        addDoc(collection(db, "users", item.userId, "notifications"), {
          type: "quest_approved",
          message: `Your quest "${item.questName}" was approved! +${item.xpReward} XP`,
          read: false,
          relatedId: item.questId,
          createdAt: now,
        }),
      ]);
      setApprovals((prev) =>
        prev.filter((a) => !(a.userId === item.userId && a.questId === item.questId))
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevise(item: ApprovalsQueueItem, revisionNote: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      await updateDoc(doc(db, "users", item.userId, "questCompletions", item.questId), {
        status: "in_progress",
        revisionNote,
        updatedAt: now,
      });
      await addDoc(collection(db, "users", item.userId, "notifications"), {
        type: "quest_revision",
        message: `Revision requested for "${item.questName}": ${revisionNote}`,
        read: false,
        relatedId: item.questId,
        createdAt: now,
      });
      setApprovals((prev) =>
        prev.filter((a) => !(a.userId === item.userId && a.questId === item.questId))
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Mission actions ─────────────────────────────────────────────────────────
  async function handleJoinMission(mission: Mission) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "users", firebaseUid, "missionCompletions", mission.missionId), {
        missionId: mission.missionId,
        status: "joined",
        xpGranted: mission.xpReward,
      });
      setMissionCompletions((prev) => ({
        ...prev,
        [mission.missionId]: { missionId: mission.missionId, status: "joined", xpGranted: mission.xpReward },
      }));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitMission(mission: Mission, notes: string, evidenceUrl: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "users", firebaseUid, "missionCompletions", mission.missionId), {
        missionId: mission.missionId,
        status: "submitted",
        submissionNotes: notes,
        evidenceUrl: evidenceUrl || null,
        xpGranted: mission.xpReward,
        updatedAt: serverTimestamp(),
      });
      setMissionCompletions((prev) => ({
        ...prev,
        [mission.missionId]: {
          missionId: mission.missionId,
          status: "submitted",
          submissionNotes: notes,
          evidenceUrl: evidenceUrl || undefined,
          xpGranted: mission.xpReward,
        },
      }));
      setExpandedMissionId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproveMission(item: MissionApprovalItem) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      batch.update(doc(db, "users", item.userId, "missionCompletions", item.missionId), {
        status: "completed",
        completedAt: now,
        approvedBy: firebaseUid,
      });
      batch.update(doc(db, "users", item.userId), { xp: increment(item.xpReward) });
      await batch.commit();
      await Promise.all([
        addDoc(collection(db, "users", item.userId, "xpLog"), {
          source: "quest_completion",
          sourceId: item.missionId,
          description: `Mission approved: ${item.missionTitle}`,
          xp: item.xpReward,
          createdAt: now,
        }),
        addDoc(collection(db, "users", item.userId, "notifications"), {
          type: "quest_approved",
          message: `Your mission "${item.missionTitle}" was approved! +${item.xpReward} XP`,
          read: false,
          relatedId: item.missionId,
          createdAt: now,
        }),
      ]);
      setMissionApprovals((prev) =>
        prev.filter((a) => !(a.userId === item.userId && a.missionId === item.missionId))
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviseMission(item: MissionApprovalItem, revisionNote: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = serverTimestamp();
      await updateDoc(doc(db, "users", item.userId, "missionCompletions", item.missionId), {
        status: "joined",
        revisionNote,
        updatedAt: now,
      });
      await addDoc(collection(db, "users", item.userId, "notifications"), {
        type: "quest_revision",
        message: `Revision requested for mission "${item.missionTitle}": ${revisionNote}`,
        read: false,
        relatedId: item.missionId,
        createdAt: now,
      });
      setMissionApprovals((prev) =>
        prev.filter((a) => !(a.userId === item.userId && a.missionId === item.missionId))
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const avatarUrl = userData
    ? buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;
  const userTeams = userData?.teams ?? [];

  const tabs = [
    ...userTeams.map((t) => ({ key: t, label: TEAM_META[t]?.label ?? t, isApprovals: false })),
    ...(userData?.role === "coordinator"
      ? [{ key: "approvals", label: "Approvals", isApprovals: true }]
      : []),
  ];

  // Derive current team's data for the volunteer view
  const activeMeta = TEAM_META[activeTab];
  const currentTier = activeMeta
    ? getCurrentTier(activeTab, completions, quests)
    : "team_member";
  const currentTierQuests = activeMeta
    ? quests.filter(q => q.teamId === activeTab && q.tier === currentTier)
    : [];
  const currentTierLabel =
    currentTier === "lead"
      ? (activeMeta?.leadTitle ?? TIER_LABELS[currentTier])
      : (TIER_LABELS[currentTier] ?? currentTier);
  const nextTierIdx = TIER_ORDER.indexOf(currentTier) + 1;
  const nextTier = nextTierIdx < TIER_ORDER.length ? TIER_ORDER[nextTierIdx] : null;
  const nextTierLabel = nextTier
    ? nextTier === "lead"
      ? (activeMeta?.leadTitle ?? TIER_LABELS[nextTier])
      : TIER_LABELS[nextTier]
    : null;

  // Earned tier: highest tier where ALL quests are complete.
  // team_member has 0 quests → vacuously complete → always the floor.
  let earnedTier: Quest["tier"] = "team_member";
  if (activeMeta) {
    for (const tier of TIER_ORDER) {
      const tierQs = quests.filter(q => q.teamId === activeTab && q.tier === tier);
      if (tierQs.every(q => completions[q.questId]?.status === "completed")) {
        earnedTier = tier;
      } else {
        break;
      }
    }
  }
  const earnedTierLabel = earnedTier === "lead"
    ? (activeMeta?.leadTitle ?? TIER_LABELS["lead"])
    : TIER_LABELS[earnedTier];
  // isMaxTier: volunteer holds the lead title AND has completed every lead quest
  const isMaxTier = earnedTier === "lead" &&
    quests.filter(q => q.teamId === activeTab && q.tier === "lead")
          .every(q => completions[q.questId]?.status === "completed");

  return (
    <PageShell
      title="Quests"
      avatarUrl={avatarUrl}
      loading={!authChecked || loadingCompletions}
      skeleton={<QuestsSkeleton />}
      actions={
        userData?.role === "coordinator" ? (
          <Link
            href="/missions/new"
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-highlight hover:bg-accent-primary rounded-xl text-white text-sm font-heading font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Mission
          </Link>
        ) : null
      }
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-5 lg:items-start">

          {/* ── Team pill switcher ─────────────────────────────────────────────── */}
          {tabs.length > 1 && (
            <div className="lg:col-span-3 flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "0ms" }}>
              {tabs.map((tab) => {
                const color = tab.isApprovals
                  ? "#A855F7"
                  : (TEAM_META[tab.key]?.color ?? "#A855F7");
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setExpandedQuestId(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-heading font-semibold transition-all border whitespace-nowrap"
                    style={{
                      borderColor: isActive ? color : "#27272A",
                      backgroundColor: isActive ? `${color}1A` : "transparent",
                      color: isActive ? color : "#71717A",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 transition-colors"
                      style={{ backgroundColor: isActive ? color : "#52525B" }}
                    />
                    {tab.label}
                    {tab.isApprovals && approvals.length > 0 && (
                      <span className="text-xs bg-accent-highlight text-white rounded-full px-1.5 py-0.5 -mr-1">
                        {approvals.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Approvals tab ─────────────────────────────────────────────────── */}
          {!loadingCompletions && activeTab === "approvals" && (
            <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-lg text-text-primary">Pending Approvals</h2>
                <button
                  onClick={loadApprovals}
                  className="text-xs text-accent-highlight hover:text-accent-primary transition-colors"
                >
                  Refresh
                </button>
              </div>
              {loadingApprovals ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex gap-2">
                    {WAVE_COLORS.map((color, i) => (
                      <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
              ) : approvals.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-4">
                  {/* Success ring + checkmark */}
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: "#22C55E12",
                      border: "2px solid #22C55E30",
                      boxShadow: "0 0 32px #22C55E18",
                    }}
                  >
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22C55E"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  {/* Copy */}
                  <div className="flex flex-col gap-1.5">
                    <p className="font-heading text-xl font-bold text-text-primary">All caught up</p>
                    <p className="text-text-secondary text-sm max-w-xs mx-auto leading-relaxed">
                      Every submission from your chapter has been reviewed.
                    </p>
                  </div>

                  {/* Secondary action */}
                  <Link
                    href="/chapter"
                    className="text-sm font-heading font-semibold transition-colors"
                    style={{ color: "#A855F7" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#7C3AED")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#A855F7")}
                  >
                    View chapter dashboard →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {approvals.map((item) => (
                    <ApprovalItem
                      key={`${item.userId}-${item.questId}`}
                      item={item}
                      onApprove={() => handleApprove(item)}
                      onRevise={(note) => handleRevise(item, note)}
                      submitting={submitting}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Volunteer quest view ──────────────────────────────────────────── */}
          {!loadingCompletions && activeTab !== "approvals" && activeMeta && (
            <>
              {/* Left column */}
              <div className="flex flex-col gap-5 lg:col-span-2">

                {/* Tier progress arc — earned tier + working-toward in one card */}
                <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
                  <TierProgressCard
                    teamId={activeTab}
                    earnedTier={earnedTier}
                    earnedTierLabel={earnedTierLabel}
                    currentTierLabel={currentTierLabel}
                    nextTierLabel={nextTierLabel}
                    color={activeMeta.color}
                    quests={currentTierQuests}
                    completions={completions}
                    isMaxTier={isMaxTier}
                  />
                </div>

                {/* Milestones card */}
                <div
                  className="rounded-2xl border border-border overflow-hidden animate-fade-up"
                  style={{ backgroundColor: "#1e1a2e", animationDelay: "120ms" }}
                >
                  <div className="h-[3px] w-full" style={{ backgroundColor: activeMeta.color }} />
                  <div className="p-4 sm:p-5">
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-4">
                      <p className="text-xs font-semibold text-text-muted tracking-widest uppercase">
                        Milestones
                      </p>
                      <div className="flex-1 h-px bg-[#27272A]" />
                      <p className="text-xs text-text-muted">
                        {currentTierQuests.filter(
                          (q) => completions[q.questId]?.status === "completed"
                        ).length}{" "}
                        / {currentTierQuests.length} done
                      </p>
                    </div>

                    {/* Collapsible quest tiles */}
                    <div className="flex flex-col gap-2.5">
                      {currentTierQuests.map((quest, qi) => {
                        const status = getQuestUIStatus(quest, completions, true);
                        return (
                          <div key={quest.questId} className="animate-fade-up" style={{ animationDelay: `${qi * 50}ms` }}>
                            <CollapsibleQuestTile
                              quest={quest}
                              status={status}
                              completion={completions[quest.questId]}
                              teamColor={activeMeta.color}
                              isExpanded={expandedQuestId === quest.questId}
                              onToggle={() =>
                                setExpandedQuestId(
                                  expandedQuestId === quest.questId ? null : quest.questId
                                )
                              }
                              onSelfMark={() => handleSelfMark(quest)}
                              onSubmitApproval={(n, e) => handleSubmitApproval(quest, n, e)}
                              submitting={submitting}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Missions */}
                <MissionsPanel
                  userData={userData!}
                  missions={missions}
                  missionCompletions={missionCompletions}
                  missionApprovals={missionApprovals}
                  loadingMissions={loadingMissions}
                  loadingMissionApprovals={loadingMissionApprovals}
                  expandedMissionId={expandedMissionId}
                  setExpandedMissionId={setExpandedMissionId}
                  submitting={submitting}
                  onJoin={handleJoinMission}
                  onSubmit={handleSubmitMission}
                  onApprove={handleApproveMission}
                  onRevise={handleReviseMission}
                />

              </div>

              {/* Right column — Journey sidebar + Badges */}
              <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-5">
                <div
                  className="rounded-2xl border border-border overflow-hidden animate-fade-up"
                  style={{ backgroundColor: "#1e1a2e", animationDelay: "240ms" }}
                >
                  <div className="h-[3px] w-full" style={{ backgroundColor: activeMeta.color }} />
                  <div className="p-4 sm:p-5">
                    <PathJourneySidebar
                      teamId={activeTab}
                      teamColor={activeMeta.color}
                      leadTitle={activeMeta.leadTitle}
                      completions={completions}
                      allQuests={quests}
                    />
                  </div>
                </div>
                <QuestBadgesCard
                  teamColor={activeMeta.color}
                  completions={completions}
                  allQuests={quests}
                  teams={userData!.teams ?? []}
                  xp={userData!.xp ?? 0}
                  eventCount={eventCount}
                  reflectionCount={reflectionCount}
                  profileSetupCount={profileSetupCount}
                />
              </div>
            </>
          )}

        </div>
      </div>
    </PageShell>
  );
}

export default function QuestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base flex items-center justify-center">
          <p className="text-text-secondary text-sm font-sans">Loading quests…</p>
        </div>
      }
    >
      <QuestsPageContent />
    </Suspense>
  );
}
