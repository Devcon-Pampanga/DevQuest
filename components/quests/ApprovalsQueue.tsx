"use client";

import Link from "next/link";
import { ApprovalCard } from "@/components/quests/ApprovalCard";
import { ApprovalsQueueItem } from "@/types/quest";

const WAVE_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];

export interface ApprovalsQueueProps {
  loading: boolean;
  items: ApprovalsQueueItem[];
  onRefresh: () => void;
  onApprove: (item: ApprovalsQueueItem) => void;
  onRevise: (item: ApprovalsQueueItem, note: string) => void;
  submitting: boolean;
}

export function ApprovalsQueue({
  loading,
  items,
  onRefresh,
  onApprove,
  onRevise,
  submitting,
}: ApprovalsQueueProps) {
  return (
    <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-lg text-text-primary">Pending Approvals</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="text-xs text-accent-highlight hover:text-accent-primary transition-colors"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex gap-2">
            {WAVE_COLORS.map((color, i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: color,
                  animation: "wave-dot 0.6s ease-in-out infinite",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "#22C55E12",
              border: "2px solid #22C55E30",
              boxShadow: "0 0 32px #22C55E18",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22C55E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-heading text-xl font-bold text-text-primary">All caught up</p>
            <p className="text-text-secondary text-sm max-w-xs mx-auto leading-relaxed">
              Every submission from your chapter has been reviewed.
            </p>
          </div>

          <Link
            href="/chapter"
            className="text-sm font-heading font-semibold transition-colors"
            style={{ color: "#A855F7" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#7C3AED";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#A855F7";
            }}
          >
            View chapter dashboard →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <ApprovalCard
              key={`${item.userId}-${item.questId}`}
              item={item}
              onApprove={() => onApprove(item)}
              onRevise={(note) => onRevise(item, note)}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
