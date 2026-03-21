"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useSidebar } from "@/context/SidebarContext";
import {
  QUESTS,
  TIER_ORDER,
  TIER_LABELS,
  TEAM_META,
} from "@/lib/seed/quests";
import { Quest, QuestCompletion, ApprovalsQueueItem } from "@/types/quest";

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

// ─── Hero Progress Card ───────────────────────────────────────────────────────

function HeroProgressCard({
  teamId,
  currentTier,
  tierLabel,
  nextTierLabel,
  color,
  quests,
  completions,
}: {
  teamId: string;
  currentTier: string;
  tierLabel: string;
  nextTierLabel: string | null;
  color: string;
  quests: Quest[];
  completions: Record<string, QuestCompletion>;
}) {
  const total = quests.length;
  const completedCount = quests.filter(
    (q) => completions[q.questId]?.status === "completed"
  ).length;
  const pct = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <div
      className="rounded-2xl overflow-hidden border border-[#27272A] relative"
      style={{ background: `linear-gradient(135deg, #1a1a2e 0%, ${color}18 100%)` }}
    >
      {/* Color accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold tracking-widest mb-1" style={{ color }}>
              CURRENT TIER
            </p>
            <h2 className="font-heading text-2xl text-text-primary leading-tight">
              {tierLabel} Journey
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              {nextTierLabel
                ? `Complete all ${total} quests to advance to ${nextTierLabel}`
                : "You've reached the final tier — complete all quests to earn your title"}
            </p>
          </div>

          {/* Badge + count */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/badges/${teamId}_${currentTier}.png`}
              alt={tierLabel}
              width={72}
              height={72}
              className="object-contain drop-shadow-lg"
            />
            <div className="text-center leading-tight">
              <span className="font-heading text-xl font-bold" style={{ color }}>{completedCount}</span>
              <span className="text-text-muted font-heading text-base"> / {total}</span>
              <p className="text-xs text-text-muted">quests done</p>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-3">
          {quests.map((q) => {
            const s = completions[q.questId]?.status;
            const isDone = s === "completed";
            const isPending = s === "pending_approval";
            return (
              <div
                key={q.questId}
                className="h-3 flex-1 rounded-full transition-all"
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

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-zinc-800/60">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
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
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 hidden sm:inline">
              {methodLabel(quest.completionMethod)}
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
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-[#27272A]">

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

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-widest text-text-muted mb-2">
        YOUR JOURNEY
      </p>

      {TIER_ORDER.map((tier) => {
        const tierQuests = allQuests.filter(q => q.teamId === teamId && q.tier === tier);
        const unlocked = isTierUnlocked(teamId, tier, completions, allQuests);
        const completedCount = tierQuests.filter(
          (q) => completions[q.questId]?.status === "completed"
        ).length;
        const total = tierQuests.length;
        const allDone = completedCount === total && total > 0;
        const isCurrent = tier === currentTier;
        const tierLabel =
          tier === "lead" ? leadTitle : (TIER_LABELS[tier] ?? tier);
        const pct = total > 0 ? (completedCount / total) * 100 : 0;

        return (
          <div
            key={tier}
            className={`rounded-xl p-3.5 flex items-center gap-3 transition-colors ${
              isCurrent
                ? "bg-[#1a1a2e] border border-[#27272A]"
                : "bg-transparent"
            }`}
            style={isCurrent ? { borderLeft: `3px solid ${teamColor}` } : {}}
          >
            {/* Badge icon */}
            <div className="shrink-0 w-10 h-10 flex items-center justify-center relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/badges/${teamId}_${tier}.png`}
                alt={tierLabel}
                width={40}
                height={40}
                className={`object-contain transition-all duration-300 ${
                  !unlocked ? "grayscale opacity-25" : "drop-shadow-md"
                }`}
              />
            </div>

            {/* Text + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className="text-sm font-heading font-semibold truncate"
                  style={{ color: !unlocked ? "#52525B" : isCurrent ? teamColor : "white" }}
                >
                  {tierLabel}
                </span>
                <span
                  className="text-xs font-semibold shrink-0"
                  style={{ color: !unlocked ? "#52525B" : isCurrent ? teamColor : "#A1A1AA" }}
                >
                  {completedCount}/{total}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800/60">
                {unlocked && (
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: allDone ? "#06B6D4" : teamColor,
                    }}
                  />
                )}
              </div>
            </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuestsPage() {
  const router = useRouter();
  const { openSidebar } = useSidebar();

  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [firebaseUid, setFirebaseUid] = useState<string>("");

  const [quests, setQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<Record<string, QuestCompletion>>({});
  const [loadingCompletions, setLoadingCompletions] = useState(true);

  const [approvals, setApprovals] = useState<ApprovalsQueueItem[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

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

  // ── Load quests (from Firestore) + completions ──────────────────────────────
  useEffect(() => {
    if (!firebaseUid) return;
    async function load() {
      setLoadingCompletions(true);
      try {
        const [questsSnap, completionsSnap] = await Promise.all([
          getDocs(collection(db, "quests")),
          getDocs(collection(db, "users", firebaseUid, "questCompletions")),
        ]);
        setQuests(questsSnap.docs.map(d => d.data() as Quest));
        const map: Record<string, QuestCompletion> = {};
        completionsSnap.docs.forEach((d) => { map[d.id] = d.data() as QuestCompletion; });
        setCompletions(map);
      } finally {
        setLoadingCompletions(false);
      }
    }
    load();
  }, [firebaseUid]);

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

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!authChecked || !userData) return null;

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);
  const userTeams = userData.teams ?? [];

  const tabs = [
    ...userTeams.map((t) => ({ key: t, label: TEAM_META[t]?.label ?? t, isApprovals: false })),
    ...(userData.role === "coordinator"
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Top Bar ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-base">
        <div className="flex items-center gap-2">
          <button
            onClick={openSidebar}
            className="lg:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="font-heading text-2xl text-text-primary tracking-wide">
            Quests
          </h1>
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


      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">

          {/* ── Team pill switcher ─────────────────────────────────────────────── */}
          {tabs.length > 1 && (
            <div className="flex flex-wrap gap-2">
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

          {/* Loading spinner */}
          {loadingCompletions && (
            <div className="flex items-center justify-center py-20">
              <div className="flex gap-2">
                {WAVE_COLORS.map((color, i) => (
                  <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Approvals tab ─────────────────────────────────────────────────── */}
          {!loadingCompletions && activeTab === "approvals" && (
            <div className="max-w-2xl">
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
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-text-secondary font-heading">No pending approvals</p>
                  <p className="text-text-muted text-sm mt-1">All caught up for your chapter.</p>
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
            <div className="flex flex-col gap-5 max-w-2xl">

                {/* Hero Progress Card */}
                <HeroProgressCard
                  teamId={activeTab}
                  currentTier={currentTier}
                  tierLabel={currentTierLabel}
                  nextTierLabel={nextTierLabel}
                  color={activeMeta.color}
                  quests={currentTierQuests}
                  completions={completions}
                />

                {/* Milestones card */}
                <div
                  className="rounded-2xl border border-border overflow-hidden"
                  style={{ backgroundColor: "#1e1a2e" }}
                >
                  <div className="h-[3px] w-full" style={{ backgroundColor: activeMeta.color }} />
                  <div className="p-5">
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
                      {currentTierQuests.map((quest) => {
                        const status = getQuestUIStatus(quest, completions, true);
                        return (
                          <CollapsibleQuestTile
                            key={quest.questId}
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
                        );
                      })}
                    </div>
                  </div>
                </div>

              <div
                className="rounded-2xl border border-border overflow-hidden"
                style={{ backgroundColor: "#1e1a2e" }}
              >
                <div className="h-[3px] w-full" style={{ backgroundColor: activeMeta.color }} />
                <div className="p-5">
                  <PathJourneySidebar
                    teamId={activeTab}
                    teamColor={activeMeta.color}
                    leadTitle={activeMeta.leadTitle}
                    completions={completions}
                    allQuests={quests}
                  />
                </div>
              </div>

            </div>
          )}

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
