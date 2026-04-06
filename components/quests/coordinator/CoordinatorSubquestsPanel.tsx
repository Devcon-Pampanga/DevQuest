"use client";

import { useState } from "react";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DIFFICULTY_META, SUBQUESTS_COLLECTION, type Subquest } from "@/types/subquest";

interface CoordinatorSubquestsPanelProps {
  subquests: Subquest[];
  onSubquestArchived: () => void;
}

type SubquestView = "active" | "closed";

function DifficultyPill({ difficulty }: { difficulty: Subquest["difficulty"] }) {
  const meta = DIFFICULTY_META[difficulty];
  return (
    <span
      className="text-[10px] font-heading px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

function AssignmentBadge({ type }: { type: Subquest["assignmentType"] }) {
  const labels: Record<Subquest["assignmentType"], string> = {
    open: "Open",
    team: "Team",
    specific: "Specific",
  };
  return (
    <span className="text-[10px] text-text-muted font-heading">
      {labels[type]}
    </span>
  );
}

function SubquestRow({
  subquest,
  onArchive,
  archiving,
}: {
  subquest: Subquest;
  onArchive: (id: string) => void;
  archiving: string | null;
}) {
  const deadlineStr = subquest.deadline
    ? subquest.deadline.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isArchiving = archiving === subquest.subquestId;
  const isClosed = subquest.status === "closed";
  const diffMeta = DIFFICULTY_META[subquest.difficulty];

  return (
    <div
      className="flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors"
      style={{
        borderColor: isClosed ? "#27272A" : `${diffMeta.color}20`,
        backgroundColor: isClosed ? "transparent" : `${diffMeta.color}06`,
        opacity: isClosed ? 0.55 : 1,
      }}
    >
      {/* Colored accent bar */}
      <div
        className="w-0.5 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: diffMeta.color, minHeight: "20px" }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-heading text-text-primary leading-tight truncate">
          {subquest.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <DifficultyPill difficulty={subquest.difficulty} />
          <AssignmentBadge type={subquest.assignmentType} />
          <span className="text-[10px] text-text-muted">+{subquest.xpReward} XP</span>
          {deadlineStr && (
            <span className="text-[10px] text-text-muted">Due {deadlineStr}</span>
          )}
        </div>
      </div>

      {/* Archive / restore button — only for active subquests */}
      {!isClosed && (
        <button
          type="button"
          onClick={() => onArchive(subquest.subquestId)}
          disabled={isArchiving}
          title="Archive subquest"
          className="shrink-0 p-1 rounded-md text-text-muted hover:text-orange-400 hover:bg-orange-400/10 transition-colors disabled:opacity-40"
        >
          {isArchiving ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

export function CoordinatorSubquestsPanel({
  subquests,
  onSubquestArchived,
}: CoordinatorSubquestsPanelProps) {
  const [view, setView] = useState<SubquestView>("active");
  const [archiving, setArchiving] = useState<string | null>(null);

  const visibleSubquests = subquests.filter((m) => m.status === view);
  const activeCount = subquests.filter((m) => m.status === "active").length;
  const closedCount = subquests.filter((m) => m.status === "closed").length;

  async function handleArchive(subquestId: string) {
    setArchiving(subquestId);
    try {
      await updateDoc(doc(db, SUBQUESTS_COLLECTION, subquestId), { status: "closed" });
      onSubquestArchived();
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden animate-fade-up"
      style={{ backgroundColor: "#1e1a2e", animationDelay: "200ms" }}
    >
      <div className="h-[3px] w-full" style={{ backgroundColor: "#A855F7" }} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-heading text-base font-bold text-text-primary leading-tight">SUBQUESTS</p>
            <p className="text-xs text-text-muted mt-0.5">Chapter-wide · Bonus XP tasks</p>
          </div>
          <Link
            href="/subquests/new"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white text-xs font-heading font-medium transition-colors shrink-0"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New
          </Link>
        </div>

        {/* Toggle: Active / Closed */}
        <div className="flex rounded-xl overflow-hidden border border-border mb-3">
          {(["active", "closed"] as SubquestView[]).map((v) => {
            const count = v === "active" ? activeCount : closedCount;
            const isActive = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-heading transition-colors capitalize"
                style={{
                  backgroundColor: isActive ? "#A855F71A" : "transparent",
                  color: isActive ? "#A855F7" : "#52525B",
                }}
              >
                {v}
                <span
                  className="text-[10px] px-1 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isActive ? "#A855F730" : "#27272A",
                    color: isActive ? "#A855F7" : "#52525B",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subquest list */}
        {visibleSubquests.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-9 h-9 rounded-xl bg-zinc-800/60 flex items-center justify-center mx-auto mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="text-text-secondary text-xs font-heading">
              {view === "active" ? "No active subquests" : "No archived subquests"}
            </p>
            {view === "active" && (
              <Link
                href="/subquests/new"
                className="text-accent-highlight text-xs hover:underline mt-1 inline-block"
              >
                Create one →
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleSubquests.map((subquest) => (
              <SubquestRow
                key={subquest.subquestId}
                subquest={subquest}
                onArchive={handleArchive}
                archiving={archiving}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
