"use client";

import { useState } from "react";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import { DIFFICULTY_META, MissionApprovalItem } from "@/types/mission";

export function MissionApprovalCard({
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
  const avatarUrl = buildAvatarUrl(item.username, item.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#16213e] p-3.5">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
            type="button"
            onClick={onApprove}
            disabled={submitting}
            className="flex-1 py-2 rounded-lg text-xs font-heading font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 disabled:opacity-50 transition-colors"
          >
            Approve
          </button>
          <button
            type="button"
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
              type="button"
              onClick={() => {
                onRevise(revNote);
                setRevising(false);
                setRevNote("");
              }}
              disabled={submitting || !revNote.trim()}
              className="flex-1 py-2 rounded-lg text-xs font-heading font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => {
                setRevising(false);
                setRevNote("");
              }}
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
