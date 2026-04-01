"use client";

import { useState } from "react";
import {
  Mission,
  MissionCompletion,
  MissionCompletionStatus,
} from "@/types/mission";
import { MissionStatusPill } from "@/components/quests/missions/MissionStatusPill";

export function MissionTile({
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
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200"
        style={{
          borderColor: isExpanded ? `${diffMeta.color}40` : "#27272A",
          backgroundColor: isExpanded ? `${diffMeta.color}0D` : "transparent",
        }}
      >
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
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#52525B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 mt-1 transition-transform duration-200"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

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

          {completion?.revisionNote && (
            <div className="mt-3 rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
              <p className="text-[10px] font-heading text-orange-400 uppercase tracking-wide mb-1">Revision Requested</p>
              <p className="text-xs text-orange-300">{completion.revisionNote}</p>
            </div>
          )}

          {mission.submissionGuidance && canSubmit && (
            <div className="mt-3 rounded-lg bg-[#ffffff06] border border-[#27272A] px-3 py-2">
              <p className="text-[10px] font-heading text-text-muted uppercase tracking-wide mb-1">What to submit</p>
              <p className="text-xs text-text-secondary">{mission.submissionGuidance}</p>
            </div>
          )}

          {canJoin && (
            <button
              type="button"
              onClick={onJoin}
              disabled={submitting}
              className="mt-3 w-full py-2.5 rounded-xl text-xs font-heading font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
            >
              {submitting ? "Joining…" : "Join Mission"}
            </button>
          )}

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
                type="button"
                onClick={() => onSubmit(notes, evidence)}
                disabled={submitting || !notes.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-heading font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
              >
                {submitting ? "Submitting…" : "Submit for Review"}
              </button>
            </div>
          )}

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
