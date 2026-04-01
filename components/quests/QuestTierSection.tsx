"use client";

import { CollapsibleQuestTile } from "@/components/quests/QuestCard";
import { getQuestUIStatus } from "@/lib/quest-utils";
import { Quest, QuestCompletion } from "@/types/quest";

export interface QuestTierSectionProps {
  teamColor: string;
  quests: Quest[];
  completions: Record<string, QuestCompletion>;
  expandedQuestId: string | null;
  onToggleQuest: (questId: string) => void;
  onSelfMark: (quest: Quest) => void;
  onSubmitApproval: (quest: Quest, notes: string, evidence: string) => void;
  submitting: boolean;
}

export function QuestTierSection({
  teamColor,
  quests,
  completions,
  expandedQuestId,
  onToggleQuest,
  onSelfMark,
  onSubmitApproval,
  submitting,
}: QuestTierSectionProps) {
  return (
    <div
      className="rounded-2xl border border-border overflow-hidden animate-fade-up"
      style={{ backgroundColor: "#1e1a2e", animationDelay: "120ms" }}
    >
      <div className="h-[3px] w-full" style={{ backgroundColor: teamColor }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-semibold text-text-muted tracking-widest uppercase">
            Milestones
          </p>
          <div className="flex-1 h-px bg-[#27272A]" />
          <p className="text-xs text-text-muted">
            {quests.filter((q) => completions[q.questId]?.status === "completed").length}{" "}
            / {quests.length} done
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {quests.map((quest, qi) => {
            const status = getQuestUIStatus(quest, completions, true);
            return (
              <div key={quest.questId} className="animate-fade-up" style={{ animationDelay: `${qi * 50}ms` }}>
                <CollapsibleQuestTile
                  quest={quest}
                  status={status}
                  completion={completions[quest.questId]}
                  teamColor={teamColor}
                  isExpanded={expandedQuestId === quest.questId}
                  onToggle={() => onToggleQuest(quest.questId)}
                  onSelfMark={() => onSelfMark(quest)}
                  onSubmitApproval={(n, e) => onSubmitApproval(quest, n, e)}
                  submitting={submitting}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
