"use client";

import type { QuestCompletion, ApprovalsQueueItem } from "@/types/quest";
import type { SubquestCompletion, SubquestApprovalItem } from "@/types/subquest";
import { useQuestSubmission } from "./useQuestSubmission";
import { useSubquestActions } from "./useSubquestActions";

interface QuestActionsOptions {
  uid: string;
  setCompletions: React.Dispatch<React.SetStateAction<Record<string, QuestCompletion>>>;
  setMissionCompletions: React.Dispatch<React.SetStateAction<Record<string, SubquestCompletion>>>;
  setApprovals: React.Dispatch<React.SetStateAction<ApprovalsQueueItem[]>>;
  setMissionApprovals: React.Dispatch<React.SetStateAction<SubquestApprovalItem[]>>;
  setExpandedQuestId: (id: string | null) => void;
  setExpandedMissionId: (id: string | null) => void;
}

export function useQuestActions({
  uid,
  setCompletions,
  setMissionCompletions,
  setApprovals,
  setMissionApprovals,
  setExpandedQuestId,
  setExpandedMissionId,
}: QuestActionsOptions) {
  const questSubmission = useQuestSubmission({
    uid,
    setCompletions,
    setApprovals,
    setExpandedQuestId,
  });

  const subquestActions = useSubquestActions({
    uid,
    setSubquestCompletions: setMissionCompletions,
    setSubquestApprovals: setMissionApprovals,
    setExpandedSubquestId: setExpandedMissionId,
  });

  return {
    submitting: questSubmission.submitting || subquestActions.submitting,
    handleSelfMark:       questSubmission.handleSelfMark,
    handleSubmitApproval: questSubmission.handleSubmitApproval,
    handleApprove:        questSubmission.handleApprove,
    handleRevise:         questSubmission.handleRevise,
    handleJoinMission:    subquestActions.handleJoinSubquest,
    handleSubmitMission:  subquestActions.handleSubmitSubquest,
    handleApproveMission: subquestActions.handleApproveSubquest,
    handleReviseMission:  subquestActions.handleReviseSubquest,
  };
}
