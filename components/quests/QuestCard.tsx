"use client";

import { useState, useEffect } from "react";
import { QuestSubmissionModal } from "@/components/quests/QuestSubmissionModal";
import { Quest, QuestCompletion, UIQuestStatus } from "@/types/quest";
import { formatDate, methodLabel } from "@/lib/quest-utils";

// ─── Status Badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: UIQuestStatus }) {
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

export function QuestDot({ status, color }: { status: UIQuestStatus; color: string }) {
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

// ─── Collapsible Quest Tile ───────────────────────────────────────────────────

interface CollapsibleQuestTileProps {
  quest: Quest;
  status: UIQuestStatus;
  completion?: QuestCompletion;
  teamColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSelfMark: () => void;
  onSubmitApproval: (notes: string, evidence: string) => void;
  submitting: boolean;
}

export function CollapsibleQuestTile({
  quest,
  status,
  completion,
  teamColor,
  isExpanded,
  onToggle,
  onSelfMark,
  onSubmitApproval,
  submitting,
}: CollapsibleQuestTileProps) {
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
            <QuestSubmissionModal
              notes={notes}
              onNotesChange={setNotes}
              evidence={evidence}
              onEvidenceChange={setEvidence}
              onSubmit={() => onSubmitApproval(notes, evidence)}
              submitting={submitting}
            />
          )}
        </div>
      )}
    </div>
  );
}
