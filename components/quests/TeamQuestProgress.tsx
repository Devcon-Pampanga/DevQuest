"use client";

import { TierProgressCard, type TierProgressCardProps } from "@/components/quests/TierProgressCard";

export interface TeamQuestProgressProps extends TierProgressCardProps {
  animationDelay?: string;
}

export function TeamQuestProgress({
  animationDelay = "60ms",
  ...tierProps
}: TeamQuestProgressProps) {
  return (
    <div className="animate-fade-up" style={{ animationDelay }}>
      <TierProgressCard {...tierProps} />
    </div>
  );
}
