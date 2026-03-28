"use client";

import { TEAM_META } from "@/lib/seed/quests";

export interface QuestFilterTab {
  key: string;
  label: string;
  isApprovals: boolean;
}

export interface QuestFilterBarProps {
  tabs: QuestFilterTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  approvalsCount: number;
}

export function QuestFilterBar({
  tabs,
  activeTab,
  onTabChange,
  approvalsCount,
}: QuestFilterBarProps) {
  if (tabs.length <= 1) return null;

  return (
    <div className="lg:col-span-3 flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "0ms" }}>
      {tabs.map((tab) => {
        const color = tab.isApprovals
          ? "#A855F7"
          : (TEAM_META[tab.key]?.color ?? "#A855F7");
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
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
            {tab.isApprovals && approvalsCount > 0 && (
              <span className="text-xs bg-accent-highlight text-white rounded-full px-1.5 py-0.5 -mr-1">
                {approvalsCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
