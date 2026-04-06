"use client";

import Link from "next/link";
import {
  Subquest,
  SubquestCompletion,
  SubquestCompletionStatus,
  SubquestApprovalItem,
  DIFFICULTY_META,
} from "@/types/subquest";
import { SubquestApprovalCard } from "@/components/quests/subquests/SubquestApprovalCard";
import { SubquestTile } from "@/components/quests/subquests/SubquestTile";

export function SubquestsPanel({
  userData,
  subquests,
  subquestCompletions,
  subquestApprovals,
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
  subquests: Subquest[];
  subquestCompletions: Record<string, SubquestCompletion>;
  subquestApprovals: SubquestApprovalItem[];
  loadingMissions: boolean;
  loadingMissionApprovals: boolean;
  expandedMissionId: string | null;
  setExpandedMissionId: (id: string | null) => void;
  submitting: boolean;
  onJoin: (m: Subquest) => void;
  onSubmit: (m: Subquest, notes: string, evidence: string) => void;
  onApprove: (item: SubquestApprovalItem) => void;
  onRevise: (item: SubquestApprovalItem, note: string) => void;
}) {
  const isCoordinator = userData.role === "coordinator";

  const visibleSubquests = isCoordinator
    ? subquests
    : subquests.filter((m) => {
        if (m.assignmentType === "open") return true;
        if (m.assignmentType === "specific") return m.assignedTo?.includes(userData.uid);
        if (m.assignmentType === "team") return m.assignedTeams?.some((t) => userData.teams.includes(t));
        return false;
      });

  function getSubquestStatus(subquest: Subquest): SubquestCompletionStatus | "available" {
    const c = subquestCompletions[subquest.subquestId];
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
        <div className="flex items-start gap-2 mb-4">
          <div className="flex-1 min-w-0">
            <p className="font-heading text-base font-bold text-text-primary leading-tight">SUBQUESTS</p>
            <p className="text-xs text-text-muted mt-0.5">Coordinator-assigned tasks · Bonus XP</p>
          </div>
          {isCoordinator && (
            <Link
              href="/subquests/new"
              className="w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-white hover:bg-accent-primary transition-colors"
              title="Create Subquest"
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
        ) : visibleSubquests.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="text-text-secondary text-xs font-heading">No active subquests</p>
            {isCoordinator && (
              <Link href="/subquests/new" className="text-accent-highlight text-xs hover:underline mt-1 inline-block">
                Create one →
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleSubquests.map((subquest) => {
              const diffMeta = DIFFICULTY_META[subquest.difficulty];
              const status = getSubquestStatus(subquest);
              const completion = subquestCompletions[subquest.subquestId];
              const isExpanded = expandedMissionId === subquest.subquestId;

              return (
                <SubquestTile
                  key={subquest.subquestId}
                  subquest={subquest}
                  diffMeta={diffMeta}
                  status={status}
                  completion={completion}
                  isExpanded={isExpanded}
                  isCoordinator={isCoordinator}
                  submitting={submitting}
                  onToggle={() => setExpandedMissionId(isExpanded ? null : subquest.subquestId)}
                  onJoin={() => onJoin(subquest)}
                  onSubmit={(notes, evidence) => onSubmit(subquest, notes, evidence)}
                />
              );
            })}
          </div>
        )}

        {isCoordinator && (
          <>
            <div className="flex items-center gap-3 mt-5 mb-3">
              <p className="text-xs font-semibold text-text-muted tracking-widest uppercase">
                Pending Approvals
              </p>
              <div className="flex-1 h-px bg-[#27272A]" />
              {subquestApprovals.length > 0 && (
                <span className="text-xs bg-accent-highlight text-white rounded-full px-1.5 py-0.5">
                  {subquestApprovals.length}
                </span>
              )}
            </div>
            {loadingMissionApprovals ? (
              <div className="flex items-center gap-1.5 py-3 justify-center">
                {["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"].map((c, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: "wave-dot 0.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            ) : subquestApprovals.length === 0 ? (
              <p className="text-text-muted text-xs text-center py-2">No pending reviews</p>
            ) : (
              <div className="flex flex-col gap-2">
                {subquestApprovals.map((item) => (
                  <SubquestApprovalCard
                    key={`${item.userId}-${item.subquestId}`}
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
