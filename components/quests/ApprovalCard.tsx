"use client";

import { useState } from "react";
import { QuestApprovalModal } from "@/components/quests/QuestApprovalModal";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import { formatDate, methodLabel } from "@/lib/quest-utils";
import { QUESTS, TEAM_META } from "@/lib/seed/quests";
import { ApprovalsQueueItem } from "@/types/quest";

export interface ApprovalCardProps {
  item: ApprovalsQueueItem;
  onApprove: () => void;
  onRevise: (note: string) => void;
  submitting: boolean;
}

export function ApprovalCard({
  item,
  onApprove,
  onRevise,
  submitting,
}: ApprovalCardProps) {
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

      <QuestApprovalModal
        revising={revising}
        revNote={revNote}
        onRevNoteChange={setRevNote}
        onStartRevise={() => setRevising(true)}
        onSendRevise={() => {
          onRevise(revNote);
          setRevising(false);
          setRevNote("");
        }}
        onCancelRevise={() => {
          setRevising(false);
          setRevNote("");
        }}
        onApprove={onApprove}
        submitting={submitting}
      />
    </div>
  );
}
